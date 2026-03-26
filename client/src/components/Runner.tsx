import { useEffect, useState } from "react"
import { X, Terminal, Globe, RefreshCcw, AlertTriangle } from "lucide-react"
import type { LocalFile } from "../lib/db"

interface RunnerProps {
  file: LocalFile | null
  code: string
  onClose: () => void
}

interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'info'
  content: string
  timestamp: string
}

export default function Runner({ file, code, onClose }: RunnerProps) {
  const [logs, setLogs] = useState<ConsoleLog[]>([])
  const [key, setKey] = useState(0) // For force refreshes

  useEffect(() => {
    setLogs([]) // Clear logs on file change or manual run
  }, [file?.id, key])

  if (!file) return null

  const isHtml = file.name.endsWith(".html")
  const isJs = file.name.endsWith(".js") || file.name.endsWith(".ts")

  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'console') {
      setLogs(prev => [...prev, {
        type: event.data.method,
        content: String(event.data.args[0]),
        timestamp: new Date().toLocaleTimeString()
      }])
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Safely escape the code for injection
  const safeCode = JSON.stringify(code || "");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <script>
          (function() {
            const _log = console.log;
            const _error = console.error;
            const _warn = console.warn;
            const _info = console.info;
            
            const send = (method, args) => {
              window.parent.postMessage({ type: 'console', method, args: args.map(a => String(a)) }, '*');
            };

            console.log = (...args) => { send('log', args); _log(...args); };
            console.error = (...args) => { send('error', args); _error(...args); };
            console.warn = (...args) => { send('warn', args); _warn(...args); };
            console.info = (...args) => { send('info', args); _info(...args); };

            try {
              send('info', ['Runner started...']);
              const code = ${safeCode};
              eval(code);
            } catch (err) {
              console.error(err.message);
            }
          })();
        </script>
      </body>
    </html>
  `

  return (
    <aside className="runner-pane">
      <div className="runner-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isHtml ? <Globe size={14} /> : <Terminal size={14} />}
          <span>{isHtml ? "Live Preview" : "Console Output"}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setKey(k => k + 1)} title="Restart">
            <RefreshCcw size={14} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="runner-body">
        {isHtml ? (
          <iframe 
            key={key}
            srcDoc={code ?? ""} 
            className="preview-frame"
            sandbox="allow-scripts allow-modals"
          />
        ) : isJs ? (
          <div className="console-output">
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} className={`console-line ${log.type}`}>
                <span className="type">[{log.timestamp}]</span>
                <span className="content">{log.content}</span>
              </div>
            )) : (
              <div className="empty-state" style={{ height: 'auto', marginTop: 40 }}>
                <Terminal size={32} />
                <p>Waiting for output...</p>
              </div>
            )}
            <iframe 
              key={key}
              style={{ width: 0, height: 0, border: 0, position: 'absolute', pointerEvents: 'none', visibility: 'hidden' }}
              srcDoc={htmlContent ?? ""}
              sandbox="allow-scripts"
            />
          </div>
        ) : (
          <div className="empty-state">
            <AlertTriangle size={32} />
            <p>Execution not supported for this file type.</p>
          </div>
        )}
      </div>
    </aside>
  )
}
