import { 
  Menu, 
  Maximize2, 
  Share2, 
  History, 
  LogOut, 
  Play, 
  Home,
  Moon,
  Sun,
  FileText,
  FileCode,
  X
} from "lucide-react"
import type { OpenTab } from "../types"
import { FileType } from "../types"

interface TopbarProps {
  tabs: OpenTab[]
  activeTabId: string | null
  user: any
  saveStatus: "synced" | "saving" | "local" | "cloud"
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onSave: () => void
  onShare: () => void
  onFullscreen: () => void
  onLogout: () => void
  onToggleSidebar: () => void
  onShowVersions: () => void
  onGoHome: () => void
  onRunCode: () => void
  viewMode: 'CODE' | 'DOCS' | 'DASHBOARD'
}

export default function Topbar({
  tabs,
  activeTabId,
  user,
  saveStatus,
  theme,
  onToggleTheme,
  onSelectTab,
  onCloseTab,
  onShare,
  onFullscreen,
  onLogout,
  onToggleSidebar,
  onShowVersions,
  onGoHome,
  onRunCode,
  viewMode
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="btn btn-ghost btn-icon" onClick={onToggleSidebar}>
          <Menu size={20} strokeWidth={2.5} />
        </button>
        <button className="btn btn-ghost btn-icon" onClick={onGoHome}>
          <Home size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="topbar-center">
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            className={`tab-item-minimal ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
            {tab.type === FileType.DOCUMENT ? <FileText size={14} /> : <FileCode size={14} />}
            <span className="tab-name">{tab.name}</span>
            <button 
              className="tab-close-minimal" 
              onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="topbar-right">
        <div className="sync-status-minimal">
            <div className={`sync-dot-architectural ${saveStatus === 'synced' ? 'bg-success' : 'bg-warning'}`} />
            <span>{saveStatus.toUpperCase()}</span>
        </div>

        <div className="action-group-minimal">
          <button className="btn btn-ghost btn-icon" onClick={onShowVersions} title="History">
            <History size={18} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onToggleTheme} title="Theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onShare} title="Share">
            <Share2 size={18} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onFullscreen} title="Focus">
            <Maximize2 size={18} />
          </button>
          
          {viewMode === 'CODE' && (
             <button className="btn-primary-minimal" onClick={onRunCode}>
                <Play size={14} fill="currentColor" />
                <span>Run</span>
             </button>
          )}

          <div className="user-section-minimal">
            <div className="avatar-minimal" title={user?.name || "User"}>
              {user?.email?.[0].toUpperCase() || "V"}
            </div>
            {user && (
              <button className="btn btn-ghost btn-icon text-error-minimal" onClick={onLogout} title="Sign Out">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .text-error-minimal { color: var(--error); opacity: 0.6; }
        .text-error-minimal:hover { opacity: 1; background: rgba(220, 38, 38, 0.05); }
        .tab-name { max-width: 140px; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem; font-weight: 700; }
        .tab-close-minimal { background: transparent; border: none; font-size: 14px; opacity: 0.4; cursor: pointer; display: flex; align-items: center; margin-left: 8px; }
        .tab-close-minimal:hover { opacity: 1; color: var(--error); }

        .sync-status-minimal { display: flex; align-items: center; gap: 8px; font-size: 0.6rem; font-weight: 800; color: var(--text-muted); padding-right: 16px; border-right: var(--border-thin); }
        .sync-dot-architectural { width: 6px; height: 6px; border-radius: 50%; }
        .bg-success { background: var(--success); }
        .bg-warning { background: var(--warning); }

        .action-group-minimal { display: flex; align-items: center; gap: 4px; padding-left: 12px; }
        .user-section-minimal { display: flex; align-items: center; gap: 16px; padding-left: 16px; border-left: var(--border-medium); }
        .avatar-minimal { width: 32px; height: 32px; background: var(--text-primary); color: var(--bg-primary); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; cursor: pointer; transition: transform 0.2s; }
        .avatar-minimal:hover { transform: scale(1.05); }

        .btn-primary-minimal {
            background: var(--text-primary);
            color: var(--bg-primary);
            border: none;
            height: 32px;
            padding: 0 12px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            cursor: pointer;
        }
      `}</style>
    </header>
  )
}