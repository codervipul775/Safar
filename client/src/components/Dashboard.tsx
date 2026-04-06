import { motion } from "framer-motion"
import { Code, FileText, Sparkles, ChevronRight, Layers, LogOut, Cpu, Globe } from "lucide-react"

interface DashboardProps {
  onSelectMode: (mode: 'CODE' | 'DOCS') => void
  onSignIn: () => void
  onLogout: () => void
  user: any
}

export default function Dashboard({ onSelectMode, onSignIn, onLogout, user }: DashboardProps) {
  const name = user?.name?.split(' ')[0] || "Architect"

  const scrollToWorkspaces = () => {
    const element = document.getElementById('workspace-selection');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="dashboard-container-scrollable fade-in">
      <header className="dashboard-header-premium light fixed">
        <div className="logo-minimal">
           <Layers size={28} strokeWidth={2.5} color="#000" />
           <span className="logo-text-minimal">Safar</span>
        </div>
        
        <div className="header-actions">
          {user ? (
            <div className="user-profile-btn light">
                <div className="user-info">
                   <span className="role-label-studio">STUDIO PRO</span>
                   <span className="user-name-studio">{name.toUpperCase()}</span>
                </div>
                <div className="v-sep-header" />
                <button className="logout-btn-studio" onClick={onLogout} title="Sign Out">
                    <LogOut size={16} />
                </button>
            </div>
          ) : (
            <button className="btn-signin-architectural" onClick={onSignIn} id="btn-dashboard-signin">JOIN THE STUDIO</button>
          )}
        </div>
      </header>

      <main className="dashboard-main-content">
        {/* THE "HARD SPLIT" HERO - FIRST SCREEN */}
        <section className="hero-section-grid-pro light">
          <div className="hero-text-side">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="hero-text-content-split"
            >
              <h1 className="hero-title-massive">Structural<br />Drafting Mastery.</h1>
              <p className="hero-subtitle-pro">Elevate your architectural narratives. Whether drafting a structural document or coding an engine, find your flow in the Safar Studio.</p>
              
              <div className="hero-cta-group-split">
                 <button onClick={scrollToWorkspaces} className="cta-action-bold">
                    CHOOSE YOUR WORKSPACE <ChevronRight size={18} />
                 </button>
              </div>

              <div className="scroll-hint-split" onClick={scrollToWorkspaces}>
                <span className="hint-label">SCROLL TO PROJECTS</span>
                <div className="hint-line-animated" />
              </div>
            </motion.div>
          </div>
          
          <div className="hero-visual-side">
            <div className="image-frame-contained">
                <img src="/hero-modern.png" alt="Safar Modern Workspace" className="hero-visual-img" />
                <div className="visual-top-shadow" />
            </div>
          </div>
        </section>

        {/* THE "TWO BOXES" RESTORED - SECOND SECTION */}
        <section id="workspace-selection" className="workspace-restored-section">
            <div className="section-header-compact">
                <span className="section-badge-minimal">ENTRY POINTS</span>
                <h2 className="section-title-compact">Select Your Instrument.</h2>
            </div>

            <div className="mode-grid-architectural-restored">
                <motion.div 
                    whileHover={{ translateY: -12 }}
                    className="mode-card-architectural-pro code"
                    onClick={() => onSelectMode('CODE')}
                >
                    <div className="card-header-minimal">
                       <div className="card-icon-frame-pro">
                         <Code size={48} strokeWidth={2.5} color="#000" />
                       </div>
                       <div className="card-status-badge">STABLE CORE</div>
                    </div>
                    <div className="card-body-minimal">
                      <h2 className="card-title-minimal">CODE REPOSITORY</h2>
                      <p className="card-text-minimal">Enter a multi-language structural environment with synchronous execution, real-time sync, and VCS connectivity.</p>
                      <div className="card-action-minimal">
                        <span>LAUNCH ARCHITECTURE</span>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                </motion.div>

                <motion.div 
                    whileHover={{ translateY: -12 }}
                    className="mode-card-architectural-pro docs"
                    onClick={() => onSelectMode('DOCS')}
                >
                    <div className="card-header-minimal">
                       <div className="card-icon-frame-pro">
                         <FileText size={48} strokeWidth={2.5} color="#000" />
                       </div>
                       <div className="card-status-badge premium">PREMIUM SUITE</div>
                    </div>
                    <div className="card-body-minimal">
                       <h2 className="card-title-minimal">DOCUMENTARY MODE</h2>
                       <p className="card-text-minimal">Access the high-fidelity 'Continuous White Channel' drafting engine. PDF exports, rich typography, and A4 print parity.</p>
                       <div className="card-action-minimal">
                         <span>START NARRATIVE</span>
                         <ChevronRight size={18} />
                       </div>
                    </div>
                </motion.div>
            </div>
        </section>

        {/* PLATFORM CAPABILITIES - THIRD SECTION */}
        <section className="capabilities-section-light">
            <div className="features-inline-grid">
                <div className="feature-block">
                    <div className="feature-icon-box"><Cpu size={24} color="#fff" /></div>
                    <div className="feature-text-content">
                        <h3>Native Engine</h3>
                        <p>Optimized for rapid architectural iterations.</p>
                    </div>
                </div>
                <div className="feature-block">
                    <div className="feature-icon-box"><Globe size={24} color="#fff" /></div>
                    <div className="feature-text-content">
                        <h3>Global Sync</h3>
                        <p>Your journey follows you across every node.</p>
                    </div>
                </div>
                <div className="feature-block">
                    <div className="feature-icon-box"><Sparkles size={24} color="#fff" /></div>
                    <div className="feature-text-content">
                        <h3>Drafting Fidelity</h3>
                        <p>High-resolution exports for world-class results.</p>
                    </div>
                </div>
            </div>
        </section>

        <footer className="footer-studio-pro">
            <div className="footer-content-box">
                <div className="footer-brand-pro">
                    <Layers size={20} color="#000" />
                    <span>Safar Studio</span>
                </div>
                <div className="v-sep-footer" />
                <p>ARCHITECTING THE WORLD'S NARRATIVES © 2026</p>
                <div className="v-sep-footer" />
                <p className="footer-build">CORE PRO V2.5 / SYNCED</p>
            </div>
        </footer>
      </main>

      <style>{`
        .dashboard-container-scrollable {
          width: 100vw;
          background: #fff;
          color: #1a1a1a;
          font-family: var(--font-ui);
          min-height: 100vh;
          position: relative;
        }

        .dashboard-header-premium.light.fixed {
          position: fixed;
          top: 0; left: 0; right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 64px;
          z-index: 1000;
          backdrop-filter: blur(24px);
          background: rgba(255, 255, 255, 0.85);
          border-bottom: 2px solid #000;
        }

        .logo-minimal { display: flex; align-items: center; gap: 12px; font-weight: 950; letter-spacing: -0.04e; text-transform: uppercase; font-size: 24px; color: #000; }

        .user-profile-btn.light {
            display: flex;
            align-items: center;
            background: #fff;
            border: 2px solid #000;
            padding: 6px 16px;
            border-radius: 100px;
        }
        
        .role-label-studio { font-size: 7px; font-weight: 950; letter-spacing: 0.15em; color: #000; margin-bottom: 1px; }
        .user-name-studio { font-size: 11px; font-weight: 950; color: #000; }
        
        .v-sep-header { width: 1px; height: 18px; background: #000; margin: 0 16px; }
        
        .logout-btn-studio {
            background: transparent; border: none; color: #000;
            cursor: pointer; transition: all 0.2s; display: flex; align-items: center;
        }
        .logout-btn-studio:hover { transform: scale(1.15); color: #ff3b3b; }

        .btn-signin-architectural {
            background: #000; color: #fff; border: none; padding: 12px 28px;
            font-size: 0.75rem; font-weight: 950; letter-spacing: 0.1em; cursor: pointer; border-radius: 4px;
        }

        /* HARD SPLIT HERO GRID - 60/40 Split Resize */
        .hero-section-grid-pro {
            height: 100vh;
            width: 100%;
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            background: #fff;
            position: relative;
        }

        .hero-text-side {
            display: flex;
            align-items: center;
            padding: 0 12% 0 10%;
            background: #fff;
            z-index: 10;
        }

        .hero-title-massive { font-size: 6.5rem; font-weight: 950; letter-spacing: -0.06em; line-height: 0.85; margin-bottom: 40px; text-transform: uppercase; color: #000; }
        .hero-subtitle-pro { font-size: 1.3rem; color: #000; line-height: 1.6; max-width: 520px; margin-bottom: 64px; font-weight: 600; }
        
        .cta-action-bold {
            background: #000; color: #fff; border: none; padding: 22px 48px;
            font-weight: 950; font-size: 15px; display: flex; align-items: center; gap: 20px;
            cursor: pointer; border-radius: 4px; transition: all 0.3s;
        }
        .cta-action-bold:hover { background: #333; transform: translateY(-8px); box-shadow: 20px 20px 0 rgba(0,0,0,0.1); }

        .hero-visual-side {
            position: relative;
            height: 100%;
            background: #f8f9fb;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 80px;
            border-left: 2px solid #000;
        }
        .image-frame-contained {
            width: 100%;
            aspect-ratio: 1 / 1;
            position: relative;
            overflow: hidden;
            border: 2px solid #000;
            box-shadow: 40px 40px 0 #edf2fa;
            max-height: 70vh;
        }
        .hero-visual-img { width: 100%; height: 100%; object-fit: cover; }
        .visual-top-shadow { position: absolute; top: 0; left: 0; right: 0; height: 150px; background: linear-gradient(to bottom, rgba(0,0,0,0.05), transparent); }

        .hint-label { font-size: 10px; font-weight: 950; letter-spacing: 0.3em; color: #000; margin-bottom: 12px; display: block; }
        .hint-line-animated { width: 40px; height: 2px; background: #000; animation: hint-bar 2s infinite ease-in-out; }
        @keyframes hint-bar { 0% { width: 0; opacity: 0; } 50% { width: 60px; opacity: 1; } 100% { width: 0; opacity: 0; } }
        
        .scroll-hint-split { margin-top: 100px; cursor: pointer; }

        /* BOX SECTIONS */
        .workspace-restored-section {
            padding: 160px 10%;
            background: #fff;
            min-height: 100vh;
            border-top: 2px solid #000;
        }
        .section-header-compact { margin-bottom: 80px; }
        .section-badge-minimal { font-size: 12px; font-weight: 950; letter-spacing: 0.3em; color: #000; }
        .section-title-compact { font-size: 4.5rem; font-weight: 950; text-transform: uppercase; margin-top: 20px; letter-spacing: -0.04em; color: #000; }

        .mode-grid-architectural-restored {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 48px;
            width: 100%;
        }

        .mode-card-architectural-pro {
            background: #fff;
            border: 3px solid #000;
            padding: 64px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column; gap: 48px;
            box-shadow: 16px 16px 0 #000;
            border-radius: 4px;
        }
        .mode-card-architectural-pro:hover { transform: translateY(-16px); box-shadow: 32px 32px 0 #d3e3fd; }

        .card-icon-frame-pro { width: 88px; height: 88px; border: 3px solid #000; display: flex; align-items: center; justify-content: center; }
        .card-status-badge { font-size: 10px; font-weight: 950; letter-spacing: 0.15em; padding: 6px 14px; border: 3px solid #000; color: #000; }
        .card-title-minimal { font-size: 2.5rem; font-weight: 950; letter-spacing: -0.04em; text-transform: uppercase; color: #000; }
        .card-text-minimal { font-size: 1.1rem; color: #000; line-height: 1.7; font-weight: 600; }

        /* CAPABILITIES */
        .capabilities-section-light { padding: 120px 10%; background: #fff; border-top: 4px solid #000; }
        .features-inline-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 80px; }
        .feature-block { display: flex; align-items: flex-start; gap: 24px; }
        .feature-icon-box { width: 56px; height: 56px; background: #000; display: flex; align-items: center; justify-content: center; color: #fff; }
        .feature-text-content h3 { font-size: 18px; font-weight: 950; text-transform: uppercase; margin-bottom: 8px; color: #000; }
        .feature-text-content p { font-size: 14px; color: #000; font-weight: 600; }

        .footer-studio-pro { padding: 80px 10%; background: #fff; border-top: 6px solid #000; }
        .footer-content-box { display: flex; align-items: center; justify-content: center; gap: 32px; color: #000; font-weight: 950; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; }
        .footer-brand-pro { display: flex; align-items: center; gap: 8px; color: #000; font-size: 16px; }
        .v-sep-footer { width: 2px; height: 16px; background: #000; }

        @media (max-width: 1200px) {
            .hero-title-massive { font-size: 4rem; }
            .hero-section-grid-pro { grid-template-columns: 1fr; height: auto; }
            .hero-text-side { padding: 160px 10% 80px 10%; }
            .hero-visual-side { height: 400px; border-left: none; border-top: 2px solid #000; }
            .mode-grid-architectural-restored { grid-template-columns: 1fr; }
            .features-inline-grid { grid-template-columns: 1fr; gap: 40px; }
        }
      `}</style>
    </div>
  )
}

