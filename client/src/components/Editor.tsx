import DocEditor from "./DocEditor"
import { FileType } from "../types"
import type { LocalFile } from "../lib/db"
import { Code, Sparkles, Pencil } from "lucide-react"
import MonacoEditor, { loader } from "@monaco-editor/react"

// Architecture Theme for Monaco
loader.init().then(monaco => {
  monaco.editor.defineTheme('architect-studio', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
      { token: 'keyword', foreground: '1a1a1a', fontStyle: 'bold' },
      { token: 'string', foreground: '059669' },
      { token: 'number', foreground: 'd97706' },
      { token: 'type', foreground: '2563eb' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1a1a1a',
      'editorLineNumber.foreground': '#cbd5e1',
      'editor.lineHighlightBackground': '#f8fafc',
      'editor.selectionBackground': '#e2e8f0',
      'editorCursor.foreground': '#111111',
    }
  });

  monaco.editor.defineTheme('architect-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '475569' },
      { token: 'keyword', foreground: '6366f1', fontStyle: 'bold' },
      { token: 'string', foreground: '10b981' },
      { token: 'number', foreground: 'f59e0b' },
    ],
    colors: {
      'editor.background': '#040712',
      'editor.foreground': '#f8fafc',
      'editorLineNumber.foreground': '#334155',
      'editor.lineHighlightBackground': '#0f172a',
      'editor.selectionBackground': '#1e293b',
      'editorCursor.foreground': '#6366f1',
    }
  });
});

interface EditorProps {
  file: LocalFile | null
  onContentChange: (id: string, content: string) => void
  viewMode: 'CODE' | 'DOCS'
  theme: 'light' | 'dark'
}

export default function Editor({ file, onContentChange, viewMode, theme }: EditorProps) {
  if (!file) {
    const isDocMode = viewMode === 'DOCS';
    return (
      <div className="empty-studio-state fade-in">
        <div className="empty-shell">
          <div className="studio-icon-frame">
             {isDocMode ? <Pencil size={40} strokeWidth={2.5} /> : <Code size={40} strokeWidth={2.5} />}
          </div>
          <h1 className="studio-title">{isDocMode ? 'STUDIO DRAFT' : 'REPOSITORY'}</h1>
          <p className="studio-subtitle">
            {isDocMode 
              ? 'Select a document from the PROJECT sidebar to begin your architectural narrative. Focus mode is enabled by default.'
              : 'Professional environment for multi-language development. Select a source file from the REPOSITORY to start building.'}
          </p>
          <div className="studio-badge-group">
              <div className="studio-badge">
                <Sparkles size={12} strokeWidth={2.5} />
                <span>ARCHITECTURAL MODE</span>
              </div>
          </div>
        </div>
      </div>
    )
  }

  if (file.type === FileType.DOCUMENT) {
    return <DocEditor fileId={file.id} content={file.content || ""} onContentChange={onContentChange} />
  }

  const handleEditorChange = (value: string | undefined) => {
    onContentChange(file.id, value || "");
  };

  return (
    <div className="architect-code-editor fade-in">
        <div className="monaco-editor-wrapper">
            <MonacoEditor
                height="100%"
                language={file.language?.toLowerCase() || 'javascript'}
                value={file.content || ""}
                onChange={(val) => handleEditorChange(val)}
                theme={theme === 'light' ? 'architect-studio' : 'architect-dark'}
                options={{
                    fontSize: 15,
                    fontFamily: 'JetBrains Mono',
                    lineHeight: 24,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 40, bottom: 40 },
                    fontWeight: '500',
                    renderLineHighlight: 'all',
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    wordWrap: 'on',
                    fixedOverflowWidgets: true,
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: 'on',
                    tabSize: 4,
                }}
            />
        </div>
        
        <div className="code-footer-architect">
            <div className="file-info-minimal">
                <Code size={14} />
                <span>{file.name.toUpperCase()}</span>
            </div>
            <div className="meta-info-minimal">
                <span>{file.language?.toUpperCase() || 'PLAIN TEXT'}</span>
                <div className="v-divider-heavy-xs" />
                <span className="ink-badge">MONACO INTELLISENSE V1</span>
            </div>
        </div>

        <style>{`
            .architect-code-editor {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--bg-primary);
                border: var(--border-medium);
            }

            .code-footer-architect {
                height: 48px;
                background: var(--bg-primary);
                border-top: var(--border-medium);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 32px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.1em;
                z-index: 10;
            }

            .file-info-minimal, .meta-info-minimal { display: flex; align-items: center; gap: 16px; }
            .v-divider-heavy-xs { width: 2px; height: 16px; background: var(--text-primary); }
            .ink-badge { background: var(--text-primary); color: var(--bg-primary); padding: 4px 12px; }
        `}</style>
    </div>
  )
}