import { useState, useEffect, useRef, useCallback } from "react"
import { FileType } from "../types"
import type { LocalFile } from "../lib/db"
import { Code, Eye, Columns, FolderOpen, FileText } from "lucide-react"

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
      <div style={{ display: "flex", gap: 4, padding: 8 }}>
        <button onClick={() => setMode("edit")}><Code size={14} /> Edit</button>
        <button onClick={() => setMode("preview")}><Eye size={14} /> Preview</button>
        <button onClick={() => setMode("split")}><Columns size={14} /> Split</button>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {(mode === "edit" || mode === "split") && (
          <textarea
            value={content}
            onChange={(e) => update(e.target.value)}
            style={{ flex: 1 }}
          />
        )}

        {(mode === "preview" || mode === "split") && (
          <div style={{ flex: 1, padding: 10, overflow: "auto" }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "*Start writing...*"}
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

  return (
    <div>
      {todos.map((t) => (
        <div key={t.id}>
          <input
            type="checkbox"
            checked={t.completed}
            onChange={() =>
              save(
                todos.map((x) =>
                  x.id === t.id ? { ...x, completed: !x.completed } : x
                )
              )
            }
          />
          {t.text}
        </div>
      ))}

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
      />
      <button onClick={add}>Add</button>
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
      style={{ width: "100%", height: "100%" }}
    />
  )
}

// MAIN EDITOR COMPONENT

export default function Editor({ file, onContentChange }: EditorProps) {
  if (!file)
    return (
      <div>
        <FolderOpen size={50} />
        <p>No file selected</p>
      </div>
    )

  if (file.type === FileType.FOLDER)
    return (
      <div>
        <FileText size={40} />
        <p>{file.name} is a folder</p>
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