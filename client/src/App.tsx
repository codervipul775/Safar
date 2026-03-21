import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Editor from "./components/Editor";
import { CreateFileModal, CreateWorkspaceModal } from "./components/Modal";

import {
  getFileTypeFromFilename,
  getLanguageFromFilename,
} from "./types";

import { FileType, SyncStatus } from "./types";
import type { FileTreeNode, OpenTab, Workspace } from "./types";

import {
  getAllWorkspaces,
  saveWorkspace,
  getFilesByWorkspace,
  getFile,
  saveFile,
  generateId,
} from "./lib/db";


import type { LocalFile, LocalWorkspace } from "./lib/db";

// ===== BUILD TREE =====
function buildTree(files: LocalFile[]): FileTreeNode[] {
  const map = new Map<string, FileTreeNode>();

  files.forEach((f) =>
    map.set(f.id, {
      ...f,
      children: [],
      isExpanded: false,
    } as FileTreeNode)
  );

  const roots: FileTreeNode[] = [];

  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ===== APP =====
export default function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWs, setActiveWs] = useState<Workspace | null>(null);

  const [files, setFiles] = useState<LocalFile[]>([]);
  const [tree, setTree] = useState<FileTreeNode[]>([]);

  const [activeFile, setActiveFile] = useState<LocalFile | null>(null);
  const [tabs, setTabs] = useState<OpenTab[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [showWsModal, setShowWsModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isFolder, setIsFolder] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  const pendingRef = useRef<Map<string, string>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== LOAD WORKSPACES =====
  useEffect(() => {
  (async () => {
    const data = await getAllWorkspaces();

    const mapped = data.map(ws => ({
      ...ws,
      syncStatus: ws.syncStatus as SyncStatus
    }));

    setWorkspaces(mapped);

    if (mapped[0]) setActiveWs(mapped[0]);
  })();
}, []);

  // ===== LOAD FILES =====
  useEffect(() => {
    if (!activeWs) return;

    (async () => {
      const f = await getFilesByWorkspace(activeWs.id);
      setFiles(f);
      setTree(buildTree(f));
    })();
  }, [activeWs]);

  // ===== SELECT FILE =====
  const openFile = async (id: string) => {
    const file = await getFile(id);
    if (!file || file.type === FileType.FOLDER) return;

    setActiveFile(file);

    setTabs((prev) =>
      prev.find((t) => t.id === id)
        ? prev
        : [...prev, {
  id: file.id,
  name: file.name,
  type: file.type,
  language: file.language,
  isModified: false
}]
    );
  };

  // ===== CREATE WORKSPACE =====
  const createWorkspace = async (name: string) => {
    const ws: LocalWorkspace = {
      id: generateId(),
      name,
      ownerId: "local",
      syncStatus: SyncStatus.LOCAL_ONLY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveWorkspace(ws);
    setShowWsModal(false);

    const updated = await getAllWorkspaces();
    setWorkspaces(
  updated.map(ws => ({
    ...ws,
    syncStatus: ws.syncStatus as SyncStatus
  }))
);
    setActiveWs(ws as unknown as Workspace);;
  };

  // ===== CREATE FILE =====
  const createFile = async (name: string) => {
    if (!activeWs) return;

    const type = isFolder ? FileType.FOLDER : getFileTypeFromFilename(name);

    const file: LocalFile = {
      id: generateId(),
      name,
      type,
      content: type === FileType.TODO ? "[]" : "",
      language: isFolder ? null : getLanguageFromFilename(name),
      parentId,
      workspaceId: activeWs.id,
      syncStatus: SyncStatus.LOCAL_ONLY,
      syncedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveFile(file);
    setShowFileModal(false);

    const updated = await getFilesByWorkspace(activeWs.id);
    setFiles(updated);
    setTree(buildTree(updated));

    if (type !== FileType.FOLDER) openFile(file.id);
  };

  const saveAll = async () => {
    for (const [id, content] of pendingRef.current) {
      const file = await getFile(id);
      if (!file) continue;

      await saveFile({
        ...file,
        content,
        syncStatus: SyncStatus.PENDING,
        updatedAt: new Date().toISOString(),
      });
    }

    pendingRef.current.clear();
    setTabs((t) => t.map((x) => ({ ...x, isModified: false })));
  };

  // ===== CONTENT CHANGE =====
  const onChange = useCallback((id: string, content: string) => {
    pendingRef.current.set(id, content);

    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isModified: true } : t))
    );

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(saveAll, 1500);
  }, []);

  

  // ===== CLOSE TAB =====
  const closeTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeFile?.id === id) setActiveFile(null);
  };

  return (
    <div className="app-layout">
      <Sidebar
        workspaces={workspaces}
        activeWorkspace={activeWs}
        fileTree={tree}
        activeFileId={activeFile?.id || null}
        isOnline={true}
        pendingChanges={0}
        sidebarOpen={sidebarOpen}
        onSelectWorkspace={setActiveWs}
        onCreateWorkspace={() => setShowWsModal(true)}
        onSelectFile={openFile}
        onCreateFile={(pid, type) => {
          setParentId(pid);
          setIsFolder(type === FileType.FOLDER);
          setShowFileModal(true);
        }}
        onToggleFolder={() => {}}
      />

      <div className="app-main">
        <Topbar
          tabs={tabs}
          activeTabId={activeFile?.id || null}
          onSelectTab={openFile}
          onCloseTab={closeTab}
          onSave={saveAll}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          onShowVersions={() => {}}
        />

        <div className="app-content">
          <Editor file={activeFile} onContentChange={onChange} />
        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={showWsModal}
        onClose={() => setShowWsModal(false)}
        onSubmit={createWorkspace}
      />

      <CreateFileModal
        isOpen={showFileModal}
        isFolder={isFolder}
        onClose={() => setShowFileModal(false)}
        onSubmit={createFile}
      />
    </div>
  );
}