import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Editor from "./components/Editor";
import Auth from "./components/Auth";
import VersionModal from "./components/VersionModal";
import Runner from "./components/Runner";
import { CreateFileModal, CreateWorkspaceModal } from "./components/Modal";

import {
  getFileTypeFromFilename,
  getLanguageFromFilename,
  FileType,
  SyncStatus
} from "./types";

import type { FileTreeNode, OpenTab, Workspace } from "./types";

import {
  getAllWorkspaces,
  saveWorkspace,
  getFilesByWorkspace,
  getFile,
  saveFile,
  generateId,
} from "./lib/db";

import { SyncService } from "./lib/syncService";
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);

  const [showWsModal, setShowWsModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showRunner, setShowRunner] = useState(false);
  const [runnerKey, setRunnerKey] = useState(0);
  const runSnapshotRef = useRef<string | null>(null);
  const liveValueRef = useRef<Map<string, string>>(new Map());
  const [isFolder, setIsFolder] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<"synced" | "saving" | "local" | "cloud">("cloud");

  const pendingRef = useRef<Map<string, string>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    // Auth Check
    const storedUser = localStorage.getItem("safar_user")
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      // Upgrade existing LOCAL_ONLY content to PENDING on load if logged in
      (async () => {
         const wsList = await getAllWorkspaces()
         for (const ws of wsList) {
           if (ws.syncStatus === SyncStatus.LOCAL_ONLY) await saveWorkspace({ ...ws, syncStatus: SyncStatus.PENDING })
           const fileList = await getFilesByWorkspace(ws.id)
           for (const f of fileList) {
             if (f.syncStatus === SyncStatus.LOCAL_ONLY) await saveFile({ ...f, syncStatus: SyncStatus.PENDING })
           }
         }
         refreshFiles();
         SyncService.pushChanges().then(count => { if (count > 0) refreshFiles(); });
      })();
    }

    // Online Status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Load Workspaces
    ;(async () => {
      const data = await getAllWorkspaces();
      const mapped = data.map(ws => ({ ...ws, syncStatus: ws.syncStatus as SyncStatus }));
      setWorkspaces(mapped);
      if (mapped[0]) setActiveWs(mapped[0]);
    })();

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, []);

  // ===== SYNC INTERVAL =====
  useEffect(() => {
    if (!isOnline || !user) return;

    const interval = setInterval(() => {
      SyncService.pushChanges().then(count => {
         if (count > 0) refreshFiles();
      });
      if (activeWs) SyncService.pullChanges(activeWs.id).then(changed => {
         if (changed) refreshFiles();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isOnline, user, activeWs]);

  // ===== DATABASE REFRESH =====
  const refreshFiles = useCallback(async () => {
    if (!activeWs) return;
    const f = await getFilesByWorkspace(activeWs.id);
    setFiles(f);
    setTree(buildTree(f));
  }, [activeWs]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

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
      ownerId: user?.id || "local",
      syncStatus: SyncStatus.LOCAL_ONLY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveWorkspace(ws);
    setShowWsModal(false);

    const updated = await getAllWorkspaces();
    setWorkspaces(updated.map(ws => ({ ...ws, syncStatus: ws.syncStatus as SyncStatus })));
    setActiveWs(ws as unknown as Workspace);
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
      syncStatus: user ? SyncStatus.PENDING : SyncStatus.LOCAL_ONLY,
      syncedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveFile(file);
    setShowFileModal(false);
    refreshFiles();

    if (type !== FileType.FOLDER) openFile(file.id);
  };

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // ===== INITIAL LOAD =====
  // ... rest of useEffect (already handled)

  // ... (Sync Interval etc.)

  // ===== CONTENT CHANGE =====
  const onChange = useCallback((id: string, content: string) => {
    pendingRef.current.set(id, content);
    liveValueRef.current.set(id, content);

    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isModified: true } : t))
    );

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onSave, 1500);
  }, []);

  const saveAll = async () => {
    const currentUser = userRef.current;
    
    for (const [id, content] of pendingRef.current) {
      const file = await getFile(id);
      if (!file) continue;

      await saveFile({
        ...file,
        content,
        syncStatus: currentUser ? SyncStatus.PENDING : SyncStatus.LOCAL_ONLY,
        updatedAt: new Date().toISOString(),
      });
    }

    pendingRef.current.clear();
    setTabs((t) => t.map((x) => ({ ...x, isModified: false })));
    refreshFiles();
    
    if (isOnline && currentUser) SyncService.pushChanges().then(count => {
        if (count > 0) refreshFiles();
    });
  };

  // ===== CLOSE TAB =====
  const closeTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeFile?.id === id) setActiveFile(null);
  };

  // ===== TOPBAR ACTIONS =====
  const onSave = async () => {
    setSaveStatus("saving");
    await saveAll();
    
    const currentUser = userRef.current;
    
    if (isOnline && currentUser) {
        const syncedCount = await SyncService.pushChanges();
        if (syncedCount > 0) refreshFiles();
        setSaveStatus("cloud");
    } else {
        setSaveStatus("local");
    }
    
    // Reset to cloud status after a delay if everything was already synced
    setTimeout(() => {
        if (pendingRef.current.size === 0) {
            setSaveStatus(isOnline && currentUser ? "cloud" : "local");
        }
    }, 2000);
  };

  const onRestoreVersion = (content: string) => {
    if (activeFile) {
        onChange(activeFile.id, content);
        setShowVersionModal(false);
    }
  };

  const onShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Workspace link copied to clipboard!");
  };

  const onFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const onLogout = () => {
    localStorage.removeItem("safar_token");
    localStorage.removeItem("safar_user");
    setUser(null);
    window.location.reload();
  };

  const handleAuthSuccess = async (u: any) => {
    setUser(u);
    setShowAuth(false);

    const wsList = await getAllWorkspaces()
    for (const ws of wsList) {
      if (ws.syncStatus === SyncStatus.LOCAL_ONLY) {
        await saveWorkspace({ ...ws, syncStatus: SyncStatus.PENDING })
      }
      
      const fileList = await getFilesByWorkspace(ws.id)
      for (const f of fileList) {
        if (f.syncStatus === SyncStatus.LOCAL_ONLY) {
          await saveFile({ ...f, syncStatus: SyncStatus.PENDING })
        }
      }
    }

    refreshFiles();
    SyncService.pushChanges();
  };

  return (
    <div className="app-layout">
      <Sidebar
        workspaces={workspaces}
        activeWorkspace={activeWs}
        fileTree={tree}
        activeFileId={activeFile?.id || null}
        isOnline={isOnline}
        pendingChanges={files.filter(f => f.syncStatus === SyncStatus.PENDING).length}
        sidebarOpen={sidebarOpen}
        onSelectWorkspace={setActiveWs}
        onCreateWorkspace={() => setShowWsModal(true)}
        onSelectFile={openFile}
        onCreateFile={(pid, type) => {
          setParentId(pid);
          setIsFolder(type === FileType.FOLDER);
          setShowFileModal(true);
        }}
        onToggleFolder={(id) => {
            setTree(prev => prev.map(function mapNode(node): FileTreeNode {
                if (node.id === id) return { ...node, isExpanded: !node.isExpanded };
                return { ...node, children: node.children.map(mapNode) };
            }));
        }}
      />

      <div className="app-main">
        <Topbar
          tabs={tabs}
          activeTabId={activeFile?.id || null}
          user={user}
          saveStatus={saveStatus}
          onSelectTab={openFile}
          onCloseTab={closeTab}
          onSave={onSave}
          onShare={onShare}
          onFullscreen={onFullscreen}
          onLogout={onLogout}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          onShowVersions={() => setShowVersionModal(true)}
          onRunCode={async () => {
            if (activeFile) {
              // Priority: Live buffer > Saved content
              const currentContent = liveValueRef.current.get(activeFile.id) || activeFile.content || "";
              runSnapshotRef.current = currentContent;
            }
            await saveAll(); // Ensure current editor content is saved to DB first
            setRunnerKey(k => k + 1)
            setShowRunner(true)
          }}
        />

        {!user && (
          <div style={{ position: 'absolute', top: 12, right: 120, zIndex: 60 }}>
            <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Sync to Cloud</button>
          </div>
        )}

        <div className="app-content">
          <div className="editor-pane">
            <Editor file={activeFile} onContentChange={onChange} />
          </div>

          {showRunner && activeFile && (
            <Runner 
              key={`${activeFile.id}-${runnerKey}`}
              file={activeFile} 
              code={runSnapshotRef.current ?? activeFile.content ?? ""}
              onClose={() => setShowRunner(false)} 
            />
          )}
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

      {showVersionModal && activeFile && (
        <VersionModal 
            fileId={activeFile.id}
            onClose={() => setShowVersionModal(false)}
            onRestore={onRestoreVersion}
        />
      )}

      {showAuth && (
        <Auth 
          onSuccess={handleAuthSuccess} 
          onClose={() => setShowAuth(false)} 
        />
      )}
    </div>
  );
}