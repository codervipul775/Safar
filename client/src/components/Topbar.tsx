import {
  X,
  FileText,
  FileCode,
  File,
  CheckSquare,
  Menu,
  Save,
  RotateCcw
} from "lucide-react"

import type { OpenTab } from "../types"
import { FileType } from "../types"

interface TopbarProps {
  tabs: OpenTab[]
  activeTabId: string | null
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onSave: () => void
  onToggleSidebar: () => void
  onShowVersions: () => void
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
  onSelectTab,
  onCloseTab,
  onSave,
  onToggleSidebar,
  onShowVersions
}: TopbarProps) {
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
              <Icon size={14} />

              <span className="tab-name">{tab.name}</span>

              {tab.isModified && <span className="dot" />}

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

      {activeTabId && (
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-icon" onClick={onSave}>
            <Save size={16} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onShowVersions}>
            <RotateCcw size={16} />
          </button>
        </div>
      )}
    </div>
  )
}