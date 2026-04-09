import React, { useState, useRef, useEffect, useCallback } from "react"
import { X, Send, Settings, Sparkles, User, Bot, Trash2, Code2, FileText } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  activeFile: { id: string; name: string; content: string | null; language: string | null } | null
  theme: 'light' | 'dark'
  onApplyCode: (code: string) => void
}

const GEMINI_MODELS = [
  { id: "gemini-2.5-flash-preview-04-17", label: "Gemini 2.5 Flash (Free)" },
  { id: "gemini-2.5-pro-preview-03-25", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
]

const getApiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const SYSTEM_PROMPT = `You are Safar AI — a senior full-stack coding assistant embedded in the Safar Studio IDE.

Rules:
- Give clear, concise answers with working code.
- When the user shares code context, analyze it carefully before responding.
- Use markdown code blocks with language tags for all code snippets.
- If the user asks to fix, refactor, or explain code, reference specific lines and logic.
- Be direct. No fluff.`



export default function ChatPanel({ isOpen, onClose, activeFile, theme, onApplyCode }: ChatPanelProps) {
  const formatMessage = (content: string): React.ReactNode => {
    const parts = content.split(/(```[\s\S]*?```)/g)
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w*)\n?([\s\S]*?)```/)
        if (match) {
          const lang = match[1] || "text"
          const code = match[2].trim()
          return (
            <div key={i} className="chat-code-block">
              <div className="chat-code-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Code2 size={12} />
                  <span>{lang}</span>
                </div>
                <button 
                  className="chat-apply-btn"
                  onClick={() => onApplyCode(code)}
                  title="Apply to active file"
                >
                  <Sparkles size={12} />
                  <span>Apply</span>
                </button>
              </div>
              <pre><code>{code}</code></pre>
            </div>
          )
        }
      }
      // Inline code
      const inlineParts = part.split(/(`[^`]+`)/g)
      return (
        <span key={i}>
          {inlineParts.map((ip, j) => {
            if (ip.startsWith("`") && ip.endsWith("`")) {
              return <code key={j} className="chat-inline-code">{ip.slice(1, -1)}</code>
            }
            // Bold
            const boldParts = ip.split(/(\*\*[^*]+\*\*)/g)
            return boldParts.map((bp, k) => {
              if (bp.startsWith("**") && bp.endsWith("**")) {
                return <strong key={`${j}-${k}`}>{bp.slice(2, -2)}</strong>
              }
              return <span key={`${j}-${k}`}>{bp}</span>
            })
          })}
        </span>
      )
    })
  }


  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("safar_gemini_key") || "")
  const [model, setModel] = useState(() => localStorage.getItem("safar_gemini_model") || "gemini-2.5-flash-preview-04-17")
  const [showSettings, setShowSettings] = useState(false)
  const [includeContext, setIncludeContext] = useState(true)
  const [keyInput, setKeyInput] = useState("")
  const [modelInput, setModelInput] = useState("")
  const [availableModels, setAvailableModels] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])
  useEffect(() => { if (isOpen) inputRef.current?.focus() }, [isOpen])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    if (!apiKey) {
      setShowSettings(true)
      return
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      // Build context
      let contextBlock = ""
      if (includeContext && activeFile?.content) {
        contextBlock = `\n\n[Active File: ${activeFile.name}]\n\`\`\`${activeFile.language || "text"}\n${activeFile.content}\n\`\`\`\n\n`
      }

      // Build conversation history for Gemini
      const history = messages.slice(-10).map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }))

      const response = await fetch(`${getApiUrl(model)}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            ...history,
            {
              role: "user",
              parts: [{ text: contextBlock + userMsg.content }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || `API Error: ${response.status}`)
      }

      const data = await response.json()
      const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received."

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMsg])
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `**Error:** ${err.message}\n\nPlease check your API key in settings.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const saveApiKey = () => {
    localStorage.setItem("safar_gemini_key", keyInput)
    localStorage.setItem("safar_gemini_model", modelInput)
    setApiKey(keyInput)
    setModel(modelInput)
    setShowSettings(false)
  }

  if (!isOpen) return null

  return (
    <div className="chat-panel" data-theme={theme}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-title">
          <Sparkles size={16} />
          <span>Safar AI</span>
          <span className="chat-model-badge">{GEMINI_MODELS.find(m => m.id === model)?.label?.split(' ')[1] || model}</span>
        </div>
        <div className="chat-header-actions">
          <button className="btn btn-ghost btn-icon" onClick={() => setMessages([])} title="Clear chat">
            <Trash2 size={16} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => { setKeyInput(apiKey); setModelInput(model); setShowSettings(true) }} title="Settings">
            <Settings size={16} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="chat-settings">
          <h4>Gemini API Key</h4>
          <p className="chat-settings-desc">Get your free key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com</a></p>
          <input
            type="password"
            className="chat-settings-input"
            placeholder="AIza..."
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
          />
          <h4 style={{marginTop: 8}}>Model</h4>
          <div style={{display: 'flex', gap: 8, marginBottom: 8}}>
            <input
              className="chat-settings-input"
              style={{marginBottom: 0, flex: 1}}
              placeholder="e.g. gemini-2.0-flash-lite"
              value={modelInput}
              onChange={e => setModelInput(e.target.value)}
            />
            <button
              className="chat-btn-secondary"
              style={{whiteSpace: 'nowrap'}}
              onClick={async () => {
                if (!keyInput) { alert("Enter your API key first"); return }
                try {
                  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyInput}`)
                  const data = await res.json()
                  const models = (data.models || [])
                    .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
                    .map((m: any) => m.name.replace("models/", ""))
                    .sort((a: string, b: string) => {
                      const getScore = (s: string) => {
                        if (s.includes("2.5")) return 1;
                        if (s.includes("2.0")) return 2;
                        if (s.includes("1.5")) return 3;
                        return 10;
                      }
                      return getScore(a) - getScore(b);
                    })

                  if (models.length > 0) {
                    setAvailableModels(models)
                    setModelInput(models[0])
                    alert(`Successfully fetched ${models.length} compatible models. Current models (2.5, 2.0, 1.5) have been moved to the top.`)
                  } else {
                    alert("No generateContent models found for this key.")
                  }
                } catch { alert("Failed to fetch models. Check your API key.") }
              }}
            >Fetch Models</button>
          </div>
          {availableModels.length > 0 && (
            <select
              className="chat-settings-input"
              value={modelInput}
              onChange={e => setModelInput(e.target.value)}
            >
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
          <div className="chat-settings-actions">
            <button className="chat-btn-secondary" onClick={() => setShowSettings(false)}>Cancel</button>
            <button className="chat-btn-primary" onClick={saveApiKey}>Save Key</button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <Sparkles size={32} />
            <h3>Safar AI Assistant</h3>
            <p>Ask me anything about your code. I can explain, debug, refactor, or generate code for you.</p>
            {activeFile && (
              <div className="chat-context-hint">
                <FileText size={14} />
                <span>Context: <strong>{activeFile.name}</strong></span>
              </div>
            )}
            {!apiKey && (
              <button className="chat-btn-primary" onClick={() => { setKeyInput(""); setShowSettings(true) }}>
                Set up API Key to start
              </button>
            )}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`chat-message chat-message-${msg.role}`}>
            <div className="chat-message-avatar">
              {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className="chat-message-body">
              <div className="chat-message-content">
                {formatMessage(msg.content)}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message chat-message-assistant">
            <div className="chat-message-avatar"><Bot size={14} /></div>
            <div className="chat-message-body">
              <div className="chat-loading">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        {activeFile && (
          <button
            className={`chat-context-toggle ${includeContext ? 'active' : ''}`}
            onClick={() => setIncludeContext(!includeContext)}
            title={includeContext ? "File context included" : "File context excluded"}
          >
            <Code2 size={12} />
            <span>{activeFile.name}</span>
          </button>
        )}
        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={apiKey ? "Ask Safar AI..." : "Set up API key first..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={!apiKey}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !apiKey}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .chat-panel {
          width: 380px;
          min-width: 380px;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary);
          border-left: var(--border-thin);
          font-family: var(--font-ui);
          position: relative;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: var(--border-thin);
          background: var(--bg-primary);
        }
        .chat-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 0.85rem;
        }
        .chat-model-badge {
          font-size: 0.6rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--bg-tertiary);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .chat-header-actions { display: flex; gap: 2px; }

        /* Settings */
        .chat-settings {
          padding: 16px;
          background: var(--bg-elevated);
          border-bottom: var(--border-thin);
        }
        .chat-settings h4 { font-size: 0.85rem; font-weight: 700; margin-bottom: 4px; }
        .chat-settings-desc { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px; }
        .chat-settings-desc a { color: var(--info); text-decoration: none; }
        .chat-settings-desc a:hover { text-decoration: underline; }
        .chat-settings-input {
          width: 100%;
          padding: 10px 12px;
          border: var(--border-thin);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: 0.8rem;
          outline: none;
          margin-bottom: 12px;
        }
        .chat-settings-input:focus { border-color: var(--accent-primary); }
        .chat-settings-actions { display: flex; gap: 8px; justify-content: flex-end; }

        .chat-btn-primary {
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .chat-btn-secondary {
          background: transparent;
          color: var(--text-secondary);
          border: var(--border-thin);
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 12px;
          padding: 40px 20px;
          color: var(--text-muted);
          flex: 1;
        }
        .chat-empty h3 { font-size: 1rem; color: var(--text-primary); font-weight: 700; }
        .chat-empty p { font-size: 0.8rem; line-height: 1.6; max-width: 280px; }

        .chat-context-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          padding: 6px 12px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }

        .chat-message {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .chat-message-avatar {
          width: 28px;
          height: 28px;
          min-width: 28px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          margin-top: 2px;
        }
        .chat-message-user .chat-message-avatar {
          background: var(--text-primary);
          color: var(--bg-primary);
        }
        .chat-message-assistant .chat-message-avatar {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .chat-message-body { flex: 1; min-width: 0; }
        .chat-message-content {
          font-size: 0.82rem;
          line-height: 1.7;
          color: var(--text-primary);
          word-break: break-word;
        }

        .chat-code-block {
          margin: 8px 0;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: var(--border-thin);
        }
        .chat-code-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          background: var(--bg-tertiary);
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .chat-apply-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          padding: 2px 8px;
          border-radius: 3px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.6rem;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .chat-apply-btn:hover { opacity: 1; }

        .chat-code-block pre {
          padding: 12px;
          background: var(--bg-primary);
          overflow-x: auto;
          margin: 0;
        }
        .chat-code-block code {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .chat-inline-code {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          background: var(--bg-tertiary);
          padding: 2px 6px;
          border-radius: 3px;
          color: var(--text-primary);
        }

        /* Loading dots */
        .chat-loading {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }
        .chat-loading span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: chatBounce 1.4s infinite;
        }
        .chat-loading span:nth-child(2) { animation-delay: 0.2s; }
        .chat-loading span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes chatBounce {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }

        /* Input Area */
        .chat-input-area {
          padding: 12px 16px;
          border-top: var(--border-thin);
          background: var(--bg-primary);
        }
        .chat-context-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          border: var(--border-thin);
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          margin-bottom: 8px;
          transition: all 0.15s ease;
        }
        .chat-context-toggle.active {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--accent-primary);
        }

        .chat-input-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          background: var(--bg-secondary);
          border: var(--border-thin);
          border-radius: var(--radius-md);
          padding: 4px;
        }
        .chat-input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-family: var(--font-ui);
          font-size: 0.82rem;
          padding: 8px 12px;
          resize: none;
          outline: none;
          max-height: 120px;
          line-height: 1.5;
        }
        .chat-input::placeholder { color: var(--text-muted); }

        .chat-send-btn {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border: none;
          background: var(--text-primary);
          color: var(--bg-primary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.15s;
        }
        .chat-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .chat-send-btn:not(:disabled):hover { opacity: 0.8; }

        /* Scrollbar */
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--text-muted); border-radius: 4px; opacity: 0.3; }
      `}</style>
    </div>
  )
}
