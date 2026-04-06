import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Editor from "./components/Editor";
import Auth from "./components/Auth";
import VersionModal from "./components/VersionModal";
import Runner from "./components/Runner";
import { CreateFileModal, CreateWorkspaceModal } from "./components/Modal";
import Dashboard from "./components/Dashboard";

import {
  getFilesByWorkspace,
  getAllWorkspaces,
  saveFile,
  saveWorkspace,
  clearAllData,
} from "./lib/db";
import type { LocalFile, LocalWorkspace } from "./lib/db";
import {
  SyncStatus,
  FileType,
  getFileTypeFromFilename,
  getLanguageFromFilename,
} from "./types";
import type { OpenTab } from "./types";
import { SyncService } from "./lib/syncService";

function buildTree(files: LocalFile[]): any[] {
  const map = new Map<string | null, any[]>();
  
  files.forEach(f => {
    const node: any = { ...f, children: [], isExpanded: true };
    if (!map.has(f.parentId)) map.set(f.parentId, []);
    map.get(f.parentId)!.push(node);
  });

  const forest = map.get(null) || [];
  const assemble = (nodes: any[]) => {
    nodes.forEach(n => {
      n.children = map.get(n.id) || [];
      assemble(n.children);
    });
  };
  assemble(forest);
  return forest;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [, setWorkspaces] = useState<LocalWorkspace[]>([]);
  const [activeWs, setActiveWs] = useState<LocalWorkspace | null>(null);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [tree, setTree] = useState<any[]>([]);
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeFile, setActiveFile] = useState<LocalFile | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [showWsModal, setShowWsModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showRunner, setShowRunner] = useState(false);
  const [runnerKey, setRunnerKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [isFolder, setIsFolder] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<FileType | null>(null);

  const [saveStatus, setSaveStatus] = useState<"synced" | "saving" | "local" | "cloud">("cloud");
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'CODE' | 'DOCS'>('DASHBOARD');
  const [pendingMode, setPendingMode] = useState<'CODE' | 'DOCS' | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem("safar_theme");
    return (saved as 'light' | 'dark') || 'light';
  });

  const pendingRef = useRef<Map<string, string>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const liveValueRef = useRef<Map<string, string>>(new Map());
  const runSnapshotRef = useRef<string | null>(null);

  // ===== THEME SYNC =====
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem("safar_theme", theme);
  }, [theme]);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    const storedUser = localStorage.getItem("safar_user")
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    ;(async () => {
      const stored = localStorage.getItem("safar_user")
      const currentUser = stored ? JSON.parse(stored) : null;
      
      // 1. PERFORM RECOVERY FIRST
      if (currentUser) {
        console.log("Sync: Checking for cloud data...");
        await SyncService.pullChanges();
      }
      
      // 2. READ RESULTS FROM DATABASE
      const data = await getAllWorkspaces();
      
      // 3. AUTO-BOOTSTRAP ONLY IF TRULY EMPTY
      if (currentUser && data.length === 0) {
          console.log("Bootstrap: No data found in cloud or local. Building Initial Studio...");
          const ws: LocalWorkspace = {
              id: crypto.randomUUID(),
              name: "Initial Studio",
              ownerId: currentUser.id,
              ownerEmail: currentUser.email,
              syncStatus: SyncStatus.LOCAL_ONLY, // Will be pushed on next sync cycle
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
          };
          await saveWorkspace(ws);
          data.push(ws);
      }

      setWorkspaces(data);
      if (data.length > 0 && !activeWs) {
        // Find most recently used workspace or first one
        const sorted = data.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setActiveWs(sorted[0]);
        // Also pull files for this workspace specifically to be sure
        const wsFiles = await getFilesByWorkspace(sorted[0].id);
        setFiles(wsFiles);
        setTree(buildTree(wsFiles));
      }
    })();

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [user?.id, activeWs?.id]);

  // ===== SYNC INTERVAL =====
  useEffect(() => {
    if (!isOnline || !user) return;
    const interval = setInterval(() => {
      SyncService.pushChanges();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOnline, user, activeWs]);

  const refreshFiles = useCallback(async () => {
    if (!activeWs) return;
    const f = await getFilesByWorkspace(activeWs.id);
    setFiles(f);
    setTree(buildTree(f));
  }, [activeWs]);

  useEffect(() => { refreshFiles(); }, [refreshFiles]);

  // ===== MODE-AWARE CONTEXT SWITCHING =====
  useEffect(() => {
    if (viewMode === 'DASHBOARD') {
      setActiveFile(null);
      return;
    }

    const currentType = viewMode === 'DOCS' ? FileType.DOCUMENT : FileType.CODE;
    
    // If current file is incompatible with mode, find a better one
    if (activeFile && activeFile.type !== currentType) {
      const compatibleTab = tabs.find(t => {
        const f = files.find(x => x.id === t.id);
        return f?.type === currentType;
      });

      if (compatibleTab) {
        const target = files.find(x => x.id === compatibleTab.id);
        if (target) setActiveFile(target);
      } else {
        // Find FIRST file in the workspace of correct type if no tabs open
        const firstMatch = files.find(f => f.type === currentType);
        setActiveFile(firstMatch || null);
      }
    } else if (!activeFile) {
        const firstMatch = files.find(f => f.type === currentType);
        setActiveFile(firstMatch || null);
    }
  }, [viewMode, files.length]);

  const openFile = async (id: string) => {
    const f = files.find(x => x.id === id);
    if (!f) return;
    setActiveFile(f);
    if (!tabs.find(t => t.id === id)) {
      setTabs([...tabs, { 
        id: f.id, 
        name: f.name, 
        type: f.type as FileType, 
        language: f.language,
        isModified: false 
      }]);
    }
  };

  const closeTab = (id: string) => {
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeFile?.id === id) {
      setActiveFile(newTabs.length > 0 ? files.find(f => f.id === newTabs[newTabs.length - 1].id) || null : null);
    }
  };

  const onChange = (id: string, content: string) => {
    // IMMEDIATE UPDATE FOR FLUID UI
    if (activeFile?.id === id) {
      setActiveFile({ ...activeFile, content });
    }
    
    liveValueRef.current.set(id, content);
    setTabs(prev => prev.map(t => t.id === id ? { ...t, isModified: true } : t));
    
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current.set(id, content);
    setSaveStatus("saving");

    timerRef.current = setTimeout(async () => {
      for (const [fid, val] of pendingRef.current.entries()) {
        const found = files.find(x => x.id === fid);
        if (found) {
           await saveFile({ ...found, content: val, syncStatus: user ? SyncStatus.PENDING : SyncStatus.LOCAL_ONLY, updatedAt: new Date().toISOString() });
        }
      }
      pendingRef.current.clear();
      setSaveStatus(user ? "synced" : "local");
      setTabs(prev => prev.map(t => t.id === id ? { ...t, isModified: false } : t));
      
      if (activeWs) {
          const updatedFiles = await getFilesByWorkspace(activeWs.id);
          setFiles(updatedFiles);
          setTree(buildTree(updatedFiles));
      }
    }, 1000);
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
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  const onLogout = async () => {
    localStorage.removeItem("safar_token");
    localStorage.removeItem("safar_user");
    await clearAllData(); // Wipe IndexedDB to prevent cross-account data leaks
    setUser(null);
    setActiveWs(null);
    setFiles([]);
    setTree([]);
    setTabs([]);
    setActiveFile(null);
    window.location.reload();
  };

  const onDeleteFile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this? All contents will be lost.")) return;
    const { deleteFileRecursive } = await import("./lib/db");
    await deleteFileRecursive(id);
    setTabs(tabs.filter(t => t.id !== id));
    if (activeFile?.id === id) setActiveFile(null);
    refreshFiles();
  };

  const createWorkspace = async (name: string) => {
    const ws: LocalWorkspace = {
      id: crypto.randomUUID(),
      name,
      ownerId: user?.id || "local",
      syncStatus: user ? SyncStatus.PENDING : SyncStatus.LOCAL_ONLY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveWorkspace(ws).then(() => SyncService.pushChanges()); // Background sync
    setWorkspaces(prev => [...prev, ws]);
    setActiveWs(ws);
    setShowWsModal(false);
  };

  const createFile = async (name: string) => {
    let wsId = activeWs?.id;

    // FAIL-SAFE: If no workspace is active, create one instantly or find the first available
    if (!wsId) {
        console.warn("Creation: No active workspace found. Re-checking database...");
        const wsList = await getAllWorkspaces();
        if (wsList.length === 0) {
            alert("Please create a workspace first using the '+' button in the sidebar top header.");
            return;
        }
        wsId = wsList[0].id;
        setActiveWs(wsList[0]);
    }

    // DUPLICATE GUARD
    const isDuplicate = files.some(f => f.name.toLowerCase() === name.toLowerCase() && f.parentId === parentId);
    if (isDuplicate) {
        alert(`A resource named "${name}" already exists here. Please choose a different name.`);
        return;
    }

    let type = getFileTypeFromFilename(name);
    if (type === FileType.TEXT && pendingType) {
        type = pendingType;
    }

    const f: LocalFile = {
      id: crypto.randomUUID(),
      workspaceId: wsId!,
      parentId,
      name,
      type: isFolder ? FileType.FOLDER : type,
      content: "",
      language: getLanguageFromFilename(name),
      syncStatus: user ? SyncStatus.PENDING : SyncStatus.LOCAL_ONLY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedAt: null
    };
    await saveFile(f);
    // SYNC LOCK: Wait for push to confirm persistence in Atlas
    await SyncService.pushChanges();
    
    // ATOMIC UI UPDATE: Direct forest generation
    setFiles(prev => {
        const next = [...prev, f];
        setTree(buildTree(next));
        return next;
    });
    
    setShowFileModal(false);
    if (!isFolder) openFile(f.id);
  };

  const handleAuthSuccess = async (u: any) => {
    setUser(u);
    setShowAuth(false);
    
    // 1. RE-ATTRIBUTION: Claim all local work for this production identity
    console.log("Sync: Re-attributing local files to production account...");
    const wsList = await getAllWorkspaces();
    for (const ws of wsList) {
      await saveWorkspace({ 
          ...ws, 
          ownerId: u.id, 
          ownerEmail: u.email,
          syncStatus: SyncStatus.PENDING
      });
      
      const fileList = await getFilesByWorkspace(ws.id);
      for (const f of fileList) {
        await saveFile({ 
            ...f, 
            ownerId: u.id, 
            ownerEmail: u.email,
            syncStatus: SyncStatus.PENDING
        });
      }
    }

    // 2. CLOUD RECOVERY: Pull existing files from account
    await SyncService.pullChanges();
    
    // 3. LOAD RECOVERED DATA: Read what was pulled and set active workspace
    const recovered = await getAllWorkspaces();
    setWorkspaces(recovered);
    
    if (recovered.length > 0) {
      const sorted = recovered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setActiveWs(sorted[0]);
      const wsFiles = await getFilesByWorkspace(sorted[0].id);
      setFiles(wsFiles);
      setTree(buildTree(wsFiles));
    }
    
    // 4. Push any re-attributed local work
    SyncService.pushChanges();
    
    if (pendingMode) { setViewMode(pendingMode); setPendingMode(null); }
  };

  const handleSelectMode = (mode: 'CODE' | 'DOCS') => {
    setViewMode(mode);
    if (!user) { 
        console.warn("Safar Studio: Entering as Guest. Cloud sync disabled.");
        setPendingMode(mode); 
    }
  };

  return (
    <>
      {viewMode === 'DASHBOARD' ? (
        <Dashboard 
          user={user} 
          onSelectMode={handleSelectMode} 
          onSignIn={() => setShowAuth(true)}
          onLogout={onLogout}
        />
      ) : (
        <div className={`app-layout ${viewMode.toLowerCase()}-mode`}>
            <Sidebar
              fileTree={tree}
              activeFileId={activeFile?.id || null}
              isOnline={isOnline}
              sidebarOpen={sidebarOpen}
              onCreateWorkspace={() => setShowWsModal(true)}
              onSelectFile={openFile}
              onDeleteFile={onDeleteFile}
              onCreateFile={(pid, type) => {
                setParentId(pid);
                setIsFolder(type === FileType.FOLDER);
                setPendingType(type);
                setShowFileModal(true);
              }}
              onToggleFolder={(id) => {
                  setTree(prev => prev.map(function mapNode(node): any {
                      if (node.id === id) return { ...node, isExpanded: !node.isExpanded };
                      return { ...node, children: node.children.map(mapNode) };
                  }));
              }}
              viewMode={viewMode}
            />

          <div className="app-main">
            <Topbar
              tabs={tabs.filter(t => {
                const f = files.find(x => x.id === t.id);
                const currentType = viewMode === 'DOCS' ? FileType.DOCUMENT : FileType.CODE;
                return f?.type === currentType;
              })}
              activeTabId={activeFile?.id || null}
              user={user}
              saveStatus={saveStatus}
              theme={theme}
              onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              onSelectTab={openFile}
              onCloseTab={closeTab}
              onSave={() => {}}
              onShare={onShare}
              onFullscreen={onFullscreen}
              onLogout={onLogout}
              onToggleSidebar={() => setSidebarOpen((s) => !s)}
              onShowVersions={() => setShowVersionModal(true)}
              onGoHome={() => setViewMode('DASHBOARD')}
              onRunCode={async () => {
                if (activeFile) {
                  const currentContent = liveValueRef.current.get(activeFile.id) || activeFile.content || "";
                  runSnapshotRef.current = currentContent;
                }
                setRunnerKey(k => k + 1)
                setShowRunner(true)
              }}
              viewMode={viewMode}
            />

            <div className="app-content">
              <div className="editor-pane">
                <Editor 
                  file={activeFile as any} 
                  onContentChange={onChange} 
                  viewMode={viewMode} 
                  theme={theme}
                />
              </div>

              {showRunner && activeFile && (
                <Runner 
                  key={`${activeFile.id}-${runnerKey}`}
                  file={activeFile as any} 
                  code={runSnapshotRef.current ?? activeFile.content ?? ""}
                  onClose={() => setShowRunner(false)} 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      <CreateWorkspaceModal isOpen={showWsModal} onClose={() => setShowWsModal(false)} onSubmit={createWorkspace} />
      <CreateFileModal isOpen={showFileModal} isFolder={isFolder} onClose={() => setShowFileModal(false)} onSubmit={createFile} />
      {showVersionModal && activeFile && <VersionModal fileId={activeFile.id} onClose={() => setShowVersionModal(false)} onRestore={onRestoreVersion} />}
      {showAuth && <Auth onSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />}
    </>
  );
}