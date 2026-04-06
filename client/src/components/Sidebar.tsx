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
  Trash2
} from "lucide-react"
import { FileType } from "../types"
import type { FileTreeNode } from "../types"

interface SidebarProps {
  fileTree: FileTreeNode[]
  activeFileId: string | null
  isOnline: boolean
  sidebarOpen: boolean
  onCreateWorkspace: () => void
  onSelectFile: (id: string) => void
  onDeleteFile: (id: string) => void
  onCreateFile: (parentId: string | null, type: FileType) => void
  onToggleFolder: (id: string) => void
  viewMode: 'CODE' | 'DOCS'
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
    return <FileCode size={18} className="tree-item-icon text-primary" />;
  }

  if (type === FileType.DOCUMENT) {
    return <FileText size={18} className="tree-item-icon text-success" />;
  }

  if (type === FileType.TODO) {
    return <CheckSquare size={18} className="tree-item-icon text-warning" />;
  }

  return <File size={18} className="tree-item-icon text-muted" />;
}

export default function Sidebar({
  fileTree,
  activeFileId,
  isOnline,
  sidebarOpen,
  onCreateWorkspace,
  onSelectFile,
  onDeleteFile,
  onCreateFile,
  onToggleFolder,
  viewMode
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filterTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes
      .map(node => {
        if (node.type === FileType.FOLDER) {
          const filteredChildren = filterTree(node.children);
          if (filteredChildren.length > 0 || node.name.toLowerCase().includes(searchQuery.toLowerCase())) return { ...node, children: filteredChildren };
          return null;
        }

        const isDoc = node.type === FileType.DOCUMENT;
        const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return null;
        if (viewMode === 'DOCS') return isDoc ? node : null;
        if (viewMode === 'CODE') return !isDoc ? node : null;
        return node;
      })
      .filter((n): n is FileTreeNode => n !== null);
  };

  const filteredTree = filterTree(fileTree);

  return (
    <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
           <Layers size={22} strokeWidth={2.5} />
           <span>Safar</span>
        </div>
        <button className="btn-icon" onClick={onCreateWorkspace}>
          <Plus size={18} />
        </button>
      </div>

      <div className="sidebar-tree">
        <div className="sidebar-section">
            <div className="sidebar-search-container">
                <Search size={14} className="text-muted" />
                <input 
                    className="sidebar-search-input"
                    placeholder="Filter resources..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        <div className="sidebar-section-header">
          <span>{viewMode === 'DOCS' ? 'PROJ. DOCUMENTS' : 'SRC. REPOSITORY'}</span>
          <div className="section-actions">
            <button className="btn-icon-xs" onClick={() => onCreateFile(null, viewMode === 'DOCS' ? FileType.DOCUMENT : FileType.CODE)}>
              <FilePlus size={20} />
            </button>
            <button className="btn-icon-xs" onClick={() => onCreateFile(null, FileType.FOLDER)}>
              <FolderPlus size={20} />
            </button>
          </div>
        </div>

        <div className="tree-items">
          {filteredTree.map(node => (
            <TreeItem 
              key={node.id} 
              node={node} 
              level={0} 
              activeId={activeFileId} 
              onSelect={onSelectFile}
              onDelete={onDeleteFile}
              onToggle={onToggleFolder}
              onAdd={(pid) => onCreateFile(pid, viewMode === 'DOCS' ? FileType.DOCUMENT : FileType.CODE)}
            />
          ))}
          {filteredTree.length === 0 && (
            <div className="empty-tree-msg">
              <p>No matches found in {viewMode === 'DOCS' ? 'Docs' : 'Code'}.</p>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="status-badge-architectural">
          <div className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
          <span>{isOnline ? 'Live Studio' : 'Offline Mode'}</span>
        </div>
        <button className="btn-settings-minimal">
          <Settings size={16} />
        </button>
      </div>

      <style>{`
        .btn-icon { background: transparent; border: none; cursor: pointer; color: var(--text-primary); }
        .btn-icon-xs { background: transparent; border: none; cursor: pointer; color: var(--text-muted); }
        .btn-icon-xs:hover { color: var(--text-primary); }

        .sidebar-search-container {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background: var(--bg-tertiary);
            border: var(--border-thin);
            margin-bottom: 20px;
        }

        .sidebar-search-input {
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-size: 0.8rem;
            outline: none;
            width: 100%;
        }

        .sidebar-footer {
            padding: 16px 20px;
            border-top: var(--border-thin);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .status-badge-architectural {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-secondary);
        }

        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .status-dot.online { background: var(--success); box-shadow: 0 0 6px var(--success); }
        .status-dot.offline { background: var(--text-muted); }

        .btn-settings-minimal { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
      `}</style>
    </aside>
  )
}

function TreeItem({ 
  node, 
  level, 
  activeId, 
  onSelect, 
  onDelete,
  onToggle,
  onAdd
}: { 
  node: FileTreeNode, 
  level: number, 
  activeId: string | null,
  onSelect: (id: string) => void,
  onDelete: (id: string) => void,
  onToggle: (id: string) => void,
  onAdd: (pid: string) => void
}) {
  const isSelected = node.id === activeId
  
  return (
    <div className="tree-item-wrapper">
      <div 
        className={`tree-item ${isSelected ? 'active' : ''}`}
        style={{ paddingLeft: `${level * 12 + 16}px` }}
        onClick={() => node.type === FileType.FOLDER ? onToggle(node.id) : onSelect(node.id)}
      >
        <div className="tree-item-left">
          {node.type === FileType.FOLDER ? (
            node.isExpanded ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />
          ) : (
             <div style={{ width: 14 }} />
          )}
          {getIcon(node.type, node.isExpanded)}
          <span className="tree-item-name">{node.name}</span>
        </div>
        
        <div className="tree-item-actions">
          {node.type === FileType.FOLDER && (
            <button 
              className="btn-tree-action" 
              onClick={(e) => { e.stopPropagation(); onAdd(node.id); }}
              title="New Resource"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          )}
          <button 
            className="btn-delete" 
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            title="Delete Resource"
          >
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      {node.type === FileType.FOLDER && node.isExpanded && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeItem 
              key={child.id} 
              node={child} 
              level={level + 1} 
              activeId={activeId} 
              onSelect={onSelect}
              onDelete={onDelete}
              onToggle={onToggle}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}
      
      <style>{`
        .tree-item-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .tree-item-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tree-item-actions { display: flex; align-items: center; gap: 4px; }
        .tree-item:hover .tree-item-actions { opacity: 1; }
        .btn-tree-action { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
        .btn-tree-action:hover { color: var(--text-primary); }
      `}</style>
    </div>
  )
}