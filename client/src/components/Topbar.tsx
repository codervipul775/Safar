import {
  X,
  FileText,
  FileCode,
  File,
  CheckSquare,
  Menu,
  Save,
  RotateCcw,
  Share2,
  Maximize2,
  LogOut,
  Loader2,
  Check,
  Cloud,
  Smartphone,
  PlayCircle
} from "lucide-react"

import type { OpenTab } from "../types"
import { FileType } from "../types"

interface TopbarProps {
  tabs: OpenTab[]
  activeTabId: string | null
  user: any
  saveStatus: "synced" | "saving" | "local" | "cloud"
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onSave: () => void
  onShare: () => void
  onFullscreen: () => void
  onLogout: () => void
  onToggleSidebar: () => void
  onShowVersions: () => void
  onRunCode: () => void
}

const getIcon = (type: FileType) => {
  if (type === FileType.MARKDOWN) return FileText
  if (type === FileType.CODE) return FileCode
  if (type === FileType.TODO) return CheckSquare
  return File
}

export default function Topbar({
  tabs,
  activeTabId,
  user,
  saveStatus,
  onSelectTab,
  onCloseTab,
  onSave,
  onShare,
  onFullscreen,
  onLogout,
  onToggleSidebar,
  onShowVersions,
  onRunCode
}: TopbarProps) {
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "?"
  const activeTab = tabs.find(t => t.id === activeTabId)
  const canRun = activeTab?.name.match(/\.(js|ts|html|py)$/)

  return (
    <div className="topbar">
      <button className="btn btn-ghost btn-icon" onClick={onToggleSidebar}>
        <Menu size={18} />
      </button>

      <div className="tabs">
        {tabs.map(tab => {
          const Icon = getIcon(tab.type)
          const active = tab.id === activeTabId

          return (
            <div
              key={tab.id}
              className={`tab ${active ? "active" : ""}`}
              onClick={() => onSelectTab(tab.id)}
            >
              <Icon size={14} className={active ? "text-accent" : ""} />

              <span className="tab-name">{tab.name}</span>

              {tab.isModified && <span className="sync-dot pending" style={{ width: 6, height: 6, marginLeft: 4 }} />}

              <span
                className="tab-close"
                onClick={e => {
                  e.stopPropagation()
                  onCloseTab(tab.id)
                }}
              >
                <X size={12} />
              </span>
            </div>
          )
        })}
      </div>

      <div className="topbar-actions">
        {saveStatus === "saving" && (
          <div className="save-indicator text-muted">
            <Loader2 size={14} className="animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {saveStatus === "local" && (
          <div className="save-indicator" style={{ color: 'var(--sync-local)' }}>
            <Smartphone size={14} />
            <span>Saved to Device</span>
          </div>
        )}
        {saveStatus === "cloud" && (
          <div className="save-indicator text-success">
            <Cloud size={14} />
            <span>Cloud Synced</span>
          </div>
        )}
        {(saveStatus === "synced" || !saveStatus) && (
          <div className="save-indicator text-success">
            <Check size={14} />
            <span>Saved</span>
          </div>
        )}

        <div className="action-group">
          {activeTabId && (
              <>
                <button className="btn btn-ghost btn-icon" onClick={onSave} title="Save Changes (Cmd+S)">
                  <Save size={16} />
                </button>
                {canRun && (
                  <button className="btn btn-ghost btn-icon" onClick={onRunCode} title="Run Code" style={{ color: 'var(--success)' }}>
                    <PlayCircle size={16} />
                  </button>
                )}
                <button className="btn btn-ghost btn-icon" onClick={onShowVersions} title="Version History">
                  <RotateCcw size={16} />
                </button>
              </>
          )}
          <button className="btn btn-ghost btn-icon" onClick={onShare} title="Share Workspace">
            <Share2 size={16} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onFullscreen} title="Toggle Fullscreen">
            <Maximize2 size={16} />
          </button>
        </div>

        {user && (
          <div className="user-profile">
            <div className="user-avatar" title={user.email}>
              {userInitial}
            </div>
            <button className="btn btn-ghost btn-icon logout-btn" onClick={onLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}