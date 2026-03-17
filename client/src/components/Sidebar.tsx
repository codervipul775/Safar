import { useState } from "react"
import {
  FolderPlus,
  FilePlus,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  File,
  CheckSquare,
  Plus,
  Layers
} from "lucide-react"
import { FileTreeNode, FileType, SyncStatus, Workspace } from "../types"

interface SidebarProps {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  fileTree: FileTreeNode[]
  activeFileId: string | null
  isOnline: boolean
  pendingChanges: number
  sidebarOpen: boolean
  onSelectWorkspace: (ws: Workspace) => void
  onCreateWorkspace: () => void
  onSelectFile: (id: string) => void
  onCreateFile: (parentId: string | null, type: FileType) => void
  onToggleFolder: (id: string) => void
}

const getIcon = (type: FileType, expanded?: boolean) => {
  if (type === FileType.FOLDER) return expanded ? FolderOpen : Folder
  if (type === FileType.MARKDOWN) return FileText
  if (type === FileType.CODE) return FileCode
  if (type === FileType.TODO) return CheckSquare
  return File
}

const getSyncColor = (status: SyncStatus) => {
  if (status === SyncStatus.PENDING) return "var(--sync-pending)"
  if (status === SyncStatus.CONFLICT) return "var(--sync-conflict)"
  if (status === SyncStatus.LOCAL_ONLY) return "var(--sync-local)"
  return "var(--sync-offline)"
}

function TreeItem({
  node,
  depth,
  activeFileId,
  onSelect,
  onToggle
}: {
  node: FileTreeNode
  depth: number
  activeFileId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}) {
  const isFolder = node.type === FileType.FOLDER
  const isActive = node.id === activeFileId
  const Icon = getIcon(node.type, node.isExpanded)

  return (
    <div>
      <div
        className={`tree-item ${isActive ? "active" : ""}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => (isFolder ? onToggle(node.id) : onSelect(node.id))}
      >
        <span style={{ width: 16 }}>
          {isFolder && (node.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>

        <Icon size={16} className="tree-item-icon" />

        <span className="tree-item-name">{node.name}</span>

        {node.syncStatus !== SyncStatus.SYNCED && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: getSyncColor(node.syncStatus)
            }}
          />
        )}
      </div>

      {isFolder && node.isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({
  workspaces,
  activeWorkspace,
  fileTree,
  activeFileId,
  isOnline,
  pendingChanges,
  sidebarOpen,
  onSelectWorkspace,
  onCreateWorkspace,
  onSelectFile,
  onCreateFile,
  onToggleFolder
}: SidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Layers size={16} />
          <span>Safar</span>
        </div>
      </div>

      <div className="sidebar-section">
        <button className="btn btn-ghost" onClick={() => setOpen(!open)}>
          {activeWorkspace?.name || "Workspace"}
          <ChevronDown size={14} />
        </button>

        {open && (
          <div className="dropdown">
            {workspaces.map(ws => (
              <div key={ws.id} onClick={() => onSelectWorkspace(ws)}>
                {ws.name}
              </div>
            ))}
            <div onClick={onCreateWorkspace}>
              <Plus size={14} /> New
            </div>
          </div>
        )}
      </div>

      {activeWorkspace && (
        <div className="sidebar-actions">
          <button onClick={() => onCreateFile(null, FileType.FOLDER)}>
            <FolderPlus size={14} />
          </button>
          <button onClick={() => onCreateFile(null, FileType.TEXT)}>
            <FilePlus size={14} />
          </button>
        </div>
      )}

      <div className="sidebar-tree">
        {fileTree.length ? (
          fileTree.map(node => (
            <TreeItem
              key={node.id}
              node={node}
              depth={0}
              activeFileId={activeFileId}
              onSelect={onSelectFile}
              onToggle={onToggleFolder}
            />
          ))
        ) : (
          <div className="empty">
            {activeWorkspace ? "No files" : "No workspace"}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <span className={`sync-dot ${isOnline ? "online" : "offline"}`} />
        <span>{isOnline ? "Online" : "Offline"}</span>
        {pendingChanges > 0 && <span>{pendingChanges}</span>}
      </div>
    </aside>
  )
}