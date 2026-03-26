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
  Layers,
  Settings,
  Search,
  Cloud,
  CloudOff
} from "lucide-react"
import { FileType, SyncStatus } from "../types"
import type { FileTreeNode, Workspace } from "../types"

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
  if (type === FileType.FOLDER) {
    return expanded
      ? <FolderOpen size={18} className="tree-item-icon" />
      : <Folder size={18} className="tree-item-icon" />;
  }

  if (type === FileType.MARKDOWN) {
    return <FileText size={18} className="tree-item-icon text-accent" />;
  }

  if (type === FileType.CODE) {
    return <FileCode size={18} className="tree-item-icon text-info" />;
  }

  if (type === FileType.TODO) {
    return <CheckSquare size={18} className="tree-item-icon text-success" />;
  }

  return <File size={18} className="tree-item-icon" />;
};

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
  const icon = getIcon(node.type, node.isExpanded)

  return (
    <div>
      <div
        className={`tree-item ${isActive ? "active" : ""}`}
        style={{ paddingLeft: depth * 12 + 12 }}
        onClick={() => (isFolder ? onToggle(node.id) : onSelect(node.id))}
      >
        <span style={{ width: 16, display: 'flex' }}>
          {isFolder && (node.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>

        {icon}

        <span className="tree-item-name">{node.name}</span>

        {node.syncStatus !== SyncStatus.SYNCED && (
          <span className={`sync-dot ${node.syncStatus.toLowerCase()}`} />
        )}
      </div>

      {isFolder && node.isExpanded && (
        <div className="tree-item-children">
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
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter tree based on search
  const filterTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes
      .map(node => ({
        ...node,
        children: node.children ? filterTree(node.children) : []
      }))
      .filter(node => 
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (node.children && node.children.length > 0)
      );
  }

  const filteredTree = searchQuery ? filterTree(fileTree) : fileTree;

  return (
    <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`} style={{ width: sidebarOpen ? 'var(--sidebar-width)' : '0' }}>
      <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="sidebar-logo">
                <Layers size={24} />
                <span>Safar</span>
            </div>
            {/* Search Toggle icon removed, using a persistent input below */}
        </div>
        
        <div className="search-bar" style={{ width: '100%', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
                type="text"
                placeholder="Search files..."
                className="input input-sm"
                style={{ width: '100%', paddingLeft: 32, height: 32, fontSize: '0.8rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      <div className="sidebar-section">
        <div 
          className="tree-item active" 
          style={{ marginBottom: 16, cursor: 'pointer' }}
          onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
        >
          <div className="logo-icon" style={{ width: 24, height: 24, background: 'var(--accent-primary)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            {activeWorkspace?.name?.charAt(0) || 'W'}
          </div>
          <span style={{ flex: 1, fontWeight: 600 }}>{activeWorkspace?.name || "Workspace"}</span>
          <ChevronDown size={14} />
        </div>

        {wsDropdownOpen && (
          <div className="glass-card" style={{ position: 'absolute', top: 110, left: 12, right: 12, zIndex: 100, padding: 8, background: 'var(--bg-elevated)' }}>
            <div className="sidebar-section-header">Switch Workspace</div>
            {workspaces.map(ws => (
              <div 
                key={ws.id} 
                className="tree-item" 
                onClick={() => {
                   onSelectWorkspace(ws);
                   setWsDropdownOpen(false);
                }}
              >
                {ws.name}
              </div>
            ))}
            <div className="tree-item" onClick={onCreateWorkspace} style={{ color: 'var(--accent-hover)' }}>
              <Plus size={14} /> New Workspace
            </div>
          </div>
        )}

        <div className="sidebar-section-header">
           <span>Files</span>
           <div style={{ display: 'flex', gap: 4 }}>
              <button 
                className="btn btn-ghost btn-icon btn-sm" 
                onClick={(e) => { e.stopPropagation(); onCreateFile(null, FileType.FOLDER); }}
                title="New Folder"
              >
                <FolderPlus size={14} />
              </button>
              <button 
                className="btn btn-ghost btn-icon btn-sm" 
                onClick={(e) => { e.stopPropagation(); onCreateFile(null, FileType.TEXT); }}
                title="New File"
              >
                <FilePlus size={14} />
              </button>
           </div>
        </div>
      </div>

      <div className="sidebar-tree">
        {filteredTree.length ? (
          filteredTree.map(node => (
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
          <div className="empty-state" style={{ fontSize: '0.8rem', opacity: 0.5 }}>
            {activeWorkspace ? "No results found" : "Select a workspace"}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isOnline ? <Cloud size={14} className="text-success" /> : <CloudOff size={14} className="text-error" />}
            <span>{isOnline ? "Cloud Synced" : "Offline Mode"}</span>
          </div>
          {pendingChanges > 0 && <span className="badge badge-pending">{pendingChanges} pending</span>}
          <Settings size={14} style={{ cursor: 'pointer' }} />
        </div>
      </div>
    </aside>
  )
}