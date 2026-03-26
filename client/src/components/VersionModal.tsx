import { X, History, RotateCcw, Calendar, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "../lib/api"

interface Version {
  id: string
  content: string
  versionNumber: number
  createdAt: string
}

interface VersionModalProps {
  fileId: string
  onClose: () => void
  onRestore: (content: string) => void
}

export default function VersionModal({ fileId, onClose, onRestore }: VersionModalProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/files/${fileId}/versions`)
        setVersions(res.data.versions)
      } catch (err) {
        console.error("Failed to load versions", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [fileId])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 450 }} onClick={e => e.stopPropagation()}>
        <div className="sidebar-section-header" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={16} />
            <span>Version History</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="version-list" style={{ maxHeight: 400, overflowY: 'auto' }}>
          {loading ? (
            <div className="empty-state">Loading versions...</div>
          ) : versions.length > 0 ? (
            versions.map((v, idx) => (
              <div 
                key={v.id} 
                className="glass-card" 
                style={{ padding: 12, marginBottom: 12, border: '1px solid var(--surface-border)', background: 'var(--bg-tertiary)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ padding: 4, borderRadius: 4, background: 'var(--bg-active)', color: 'var(--accent-primary)' }}>
                            #{v.versionNumber}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                {idx === 0 ? "Current Version" : `Version ${v.versionNumber}`}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={12} /> {new Date(v.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    {idx > 0 && (
                        <button 
                            className="btn btn-sm btn-ghost" 
                            style={{ color: 'var(--accent-primary)' }}
                            onClick={() => onRestore(v.content)}
                        >
                            <RotateCcw size={14} /> Restore
                        </button>
                    )}
                    {idx === 0 && (
                        <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                            <CheckCircle2 size={14} /> Active
                        </div>
                    )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ opacity: 0.5 }}>No versions saved yet.</div>
          )}
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
