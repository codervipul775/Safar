import { useState } from "react"
import { api } from "../lib/api"
import { X, Mail, Lock, User as UserIcon } from "lucide-react"

interface AuthProps {
  onSuccess: (user: any) => void
  onClose: () => void
}

export default function Auth({ onSuccess, onClose }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register"
      const payload = isLogin ? { email, password } : { email, password, name }
      
      const res = await api.post(endpoint, payload)
      localStorage.setItem("safar_token", res.data.token)
      localStorage.setItem("safar_user", JSON.stringify(res.data.user))
      
      onSuccess(res.data.user)
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: 400 }}>
        <div className="modal-header">
           <h3 className="modal-title">{isLogin ? "Welcome Back" : "Create Account"}</h3>
           <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
          {isLogin ? "Sign in to sync your workspace to the cloud." : "Join Safar to work anywhere, offline-first."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isLogin && (
            <div style={{ position: 'relative' }}>
               <UserIcon size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
               <input 
                 className="input" 
                 style={{ paddingLeft: 40, width: '100%' }} 
                 placeholder="Full Name" 
                 value={name} 
                 onChange={e => setName(e.target.value)} 
                 required 
               />
            </div>
          )}

          <div style={{ position: 'relative' }}>
             <Mail size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
             <input 
               type="email" 
               className="input" 
               style={{ paddingLeft: 40, width: '100%' }} 
               placeholder="Email Address" 
               value={email} 
               onChange={e => setEmail(e.target.value)} 
               required 
             />
          </div>

          <div style={{ position: 'relative' }}>
             <Lock size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
             <input 
               type="password" 
               className="input" 
               style={{ paddingLeft: 40, width: '100%' }} 
               placeholder="Password" 
               value={password} 
               onChange={e => setPassword(e.target.value)} 
               required 
             />
          </div>

          {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Create Account")}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <span 
              style={{ color: 'var(--accent-hover)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign Up" : "Log In"}
            </span>
          </p>
        </form>
      </div>
    </div>
  )
}
