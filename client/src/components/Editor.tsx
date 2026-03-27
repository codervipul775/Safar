import { useState, useEffect, useRef, useCallback } from "react"
import { FileType } from "../types"
import type { LocalFile } from "../lib/db"
import { Code, Eye, Columns, FolderOpen, FileText, Plus, CheckCircle2, Circle, CheckSquare } from "lucide-react"

import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { oneDark } from "@codemirror/theme-one-dark"
import { javascript } from "@codemirror/lang-javascript"
import { markdown } from "@codemirror/lang-markdown"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface EditorProps {
  file: LocalFile | null
  onContentChange: (id: string, content: string) => void
}

const getLang = (lang: string | null) =>
  lang === "markdown" ? markdown() : javascript()

// CODE-EDITOR

function CodeEditor({
  file,
  onContentChange,
}: {
  file: LocalFile
  onContentChange: (id: string, content: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!ref.current) return

    view.current?.destroy()

    const state = EditorState.create({
      doc: file.content || "",
      extensions: [
        basicSetup,
        oneDark,
        getLang(file.language),
        EditorView.updateListener.of((v) => {
          if (v.docChanged) {
            onContentChange(file.id, v.state.doc.toString())
          }
        }),
        EditorView.theme({
          "&": { height: "100%", backgroundColor: "var(--bg-primary)" },
          ".cm-scroller": { fontFamily: "var(--font-mono)", fontSize: "14px" },
          ".cm-gutters": { backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)", border: "none" }
        })
      ],
    })

    view.current = new EditorView({
      state,
      parent: ref.current,
    })

    return () => view.current?.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id])

  return <div ref={ref} style={{ height: "100%" }} />
}

// MARKDOWN-EDITOR

function MarkdownEditor({
  file,
  onContentChange,
}: {
  file: LocalFile
  onContentChange: (id: string, content: string) => void
}) {
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split")
  const [content, setContent] = useState(() => file.content || "")

  useEffect(() => {
    if (file.content !== content) {
      setContent(file.content || "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id])

  const update = useCallback(
    (val: string) => {
      setContent(val)
      onContentChange(file.id, val)
    },
    [file.id, onContentChange]
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", gap: 4, padding: "8px 16px", borderBottom: '1px solid var(--surface-border)' }}>
        <button className={`btn btn-sm ${mode === 'edit' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode("edit")}><Code size={14} /> Edit</button>
        <button className={`btn btn-sm ${mode === 'preview' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode("preview")}><Eye size={14} /> Preview</button>
        <button className={`btn btn-sm ${mode === 'split' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode("split")}><Columns size={14} /> Split</button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: 'hidden' }}>
        {(mode === "edit" || mode === "split") && (
          <textarea
            value={content}
            onChange={(e) => update(e.target.value)}
            className="input"
            style={{ flex: 1, height: '100%', border: 'none', borderRadius: 0, resize: 'none', fontFamily: 'var(--font-mono)', padding: 20 }}
          />
        )}

        {mode === "split" && <div style={{ width: 1, background: 'var(--surface-border)' }} />}

        {(mode === "preview" || mode === "split") && (
          <div className="markdown-preview" style={{ flex: 1 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "# Start writing markdown..."}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

// TODO-EDITOR

interface TodoItem {
  id: string
  text: string
  completed: boolean
}

function TodoEditor({
  file,
  onContentChange,
}: {
  file: LocalFile
  onContentChange: (id: string, content: string) => void
}) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [input, setInput] = useState("")

  useEffect(() => {
    let parsed: TodoItem[] = []
    try {
      const data = JSON.parse(file.content || "[]")
      if (Array.isArray(data)) parsed = data
    } catch (err) {
      console.warn("Invalid JSON", err)
    }
    setTodos(parsed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id])

  const save = (data: TodoItem[]) => {
    setTodos(data)
    onContentChange(file.id, JSON.stringify(data))
  }

  const add = () => {
    if (!input.trim()) return
    save([
      ...todos,
      { id: crypto.randomUUID(), text: input, completed: false },
    ])
    setInput("")
  }

  const toggle = (id: string) => {
    save(todos.map((t) => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  return (
    <div className="todo-list">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckSquare className="text-accent" /> Tasks
          </h2>

          <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                className="input"
                style={{ flex: 1 }}
                placeholder="What needs to be done?"
            />
            <button className="btn btn-primary" onClick={add}><Plus size={18} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todos.map((t) => (
                <div key={t.id} className={`todo-item ${t.completed ? 'completed' : ''}`} onClick={() => toggle(t.id)}>
                    {t.completed ? <CheckCircle2 className="text-success" /> : <Circle className="text-muted" />}
                    <span style={{ textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1 }}>
                        {t.text}
                    </span>
                </div>
            ))}
          </div>

          {todos.length === 0 && (
              <div className="empty-state" style={{ marginTop: 40 }}>
                  <CheckSquare size={48} />
                  <p>Your task list is clear!</p>
              </div>
          )}
      </div>
    </div>
  )
}

// TEXT-EDITOR

function TextEditor({
  file,
  onContentChange,
}: {
  file: LocalFile
  onContentChange: (id: string, content: string) => void
}) {
  const [content, setContent] = useState(() => file.content || "")

  useEffect(() => {
    if (file.content !== content) {
      setContent(file.content || "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id])

  return (
    <textarea
      value={content}
      onChange={(e) => {
        setContent(e.target.value)
        onContentChange(file.id, e.target.value)
      }}
      className="input"
      style={{ width: "100%", height: "100%", border: 'none', borderRadius: 0, resize: 'none', padding: 40, background: 'var(--bg-primary)', fontSize: '1.1rem' }}
      placeholder="Start typing your notes here..."
    />
  )
}

// MAIN EDITOR COMPONENT

export default function Editor({ file, onContentChange }: EditorProps) {
  if (!file)
    return (
      <div className="empty-state">
        <FolderOpen size={64} className="text-muted" />
        <h3>Empty Workspace</h3>
        <p>Select a file from the sidebar to start working</p>
      </div>
    )

  if (file.type === FileType.FOLDER)
    return (
      <div className="empty-state">
        <FileText size={64} className="text-accent" />
        <h3>{file.name}</h3>
        <p>This is a directory. Open a file to view content.</p>
      </div>
    )

  switch (file.type) {
    case FileType.CODE:
      return <CodeEditor file={file} onContentChange={onContentChange} />
    case FileType.MARKDOWN:
      return <MarkdownEditor file={file} onContentChange={onContentChange} />
    case FileType.TODO:
      return <TodoEditor file={file} onContentChange={onContentChange} />
    default:
      return <TextEditor file={file} onContentChange={onContentChange} />
  }
}