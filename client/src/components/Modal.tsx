import { useEffect, useRef } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" ref={ref}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// SHARED INPUT MODAL

interface InputModalProps {
  isOpen: boolean
  title: string
  label: string
  placeholder: string
  onClose: () => void
  onSubmit: (value: string) => void
}

function InputModal({
  isOpen,
  title,
  label,
  placeholder,
  onClose,
  onSubmit,
}: InputModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = inputRef.current?.value.trim()
    if (!value) return
    onSubmit(value)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="modal-label">{label}</label>

        <input
          ref={inputRef}
          className="input"
          placeholder={placeholder}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </div>
      </form>
    </Modal>
  )
}
//FILE & FOLDER

export function CreateFileModal({
  isOpen,
  isFolder,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  isFolder: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  return (
    <InputModal
      isOpen={isOpen}
      title={isFolder ? "New Folder" : "New File"}
      label={isFolder ? "Folder name" : "File name"}
      placeholder={isFolder ? "My Folder" : "file.txt"}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}

// WORKSPACE

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  return (
    <InputModal
      isOpen={isOpen}
      title="New Workspace"
      label="Workspace name"
      placeholder="My Workspace"
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}