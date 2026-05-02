import { Link } from "react-router-dom";
import logo from "../assets/logo/Autodeployment.png";
import "../styles/home.css";

export default function Home() {
  return (
    <div className="home">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <img src={logo} alt="logo" className="nav-logo-img" />
          <span className="brand-name">Project Auto<span className="brand-accent">Deploy</span>ment System</span>
        </div>

        <div className="nav-center">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="nav-right">
          <Link to="/login" className="nav-login">Login</Link>
          <Link to="/register" className="nav-cta">
            Get Started
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-bg-orb orb1" />
        <div className="hero-bg-orb orb2" />
        <div className="hero-grid-overlay" />

        <div className="hero-left">
          <div className="hero-badge">
            <span className="badge-pulse" />
            Now with GitHub Actions support
          </div>

          <h1 className="hero-title">
            Deploy Your Projects <br />
            <span className="gradient-text">Automatically</span> 🚀
          </h1>

          <p className="hero-sub">
            No setup. No configuration. Just connect your GitHub repo and get a live URL in seconds — not hours.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="btn-primary">
              Start Free
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M3.75 9H14.25M9.75 4.5L14.25 9L9.75 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link to="/login" className="btn-outline">Login</Link>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">10k+</span>
              <span className="stat-label">Deployments</span>
            </div>
            <div className="stat-sep" />
            <div className="stat">
              <span className="stat-num">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
            <div className="stat-sep" />
            <div className="stat">
              <span className="stat-num">&lt;30s</span>
              <span className="stat-label">Deploy Time</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=700&q=80"
              alt="Developer coding"
              className="hero-img"
            />
            <div className="hero-img-overlay" />
            <div className="img-badge img-badge--top">
              <span className="img-badge-dot green" />
              <span>Build successful</span>
            </div>
            <div className="img-badge img-badge--bottom">
              <span className="img-badge-dot sky" />
              <span>Live at autodeploy.live</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="section-tag">FEATURES</div>
        <h2 className="section-title">Why Use Auto Deployment System?</h2>
        <p className="section-sub">Everything you need to ship faster — without the headache.</p>

        <div className="features-grid">


          <div className="fcard">
            <div className="fcard-icon" style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 22V18a4.852 4.852 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Zero Configuration</h3>
            <p>No software to install, no servers to manage, no YAML files to write. Everything works the moment you connect your repository.</p>
            <span className="fcard-tag">Auto-Setup</span>
          </div>

          <div className="fcard">
            <div className="fcard-icon" style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <h3>Instant Live URL</h3>
            <p>Your app goes live in under 30 seconds with a unique shareable link on our global CDN.</p>
            <span className="fcard-tag">Global CDN</span>
          </div>

          <div className="fcard fcard-accent">
            <div className="fcard-icon" style={{ background: "linear-gradient(135deg,#38bdf8,#0ea5e9)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 3v18h18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 16l4-4 4 4 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Live Logs & Monitoring</h3>
            <p>Track builds, errors, and deployments in real time. Rich logs and instant alerts keep your app healthy 24/7.</p>
            <span className="fcard-tag">Real-time</span>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-bg-orb" />
        <div className="section-tag">PROCESS</div>
        <h2 className="section-title">How It Works</h2>
        <p className="section-sub">From code to live — in four simple steps.</p>

        <div className="steps">
          {[
            { n: "01", emoji: "🔗", label: "Enter GitHub URL", desc: "Paste your public or private repository link" },
            { n: "02", emoji: "▶️", label: "Click Deploy", desc: "Hit deploy and let our system take over" },
            { n: "03", emoji: "⚙️", label: "Auto Build", desc: "We detect your stack and build automatically" },
            { n: "04", emoji: "🎉", label: "Get Live URL", desc: "Share your app with the world instantly" },
          ].map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-number">{s.n}</div>
              <div className="step-emoji">{s.emoji}</div>
              <h4>{s.label}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="benefits">
        <div className="benefits-inner">
          <div className="benefits-left">
            <div className="section-tag">WHY US</div>
            <h2 className="section-title" style={{ textAlign: "left" }}>No More Manual Deployment</h2>
            <p className="section-sub" style={{ textAlign: "left" }}>Stop wasting time on DevOps. Focus on building.</p>
            <Link to="/register" className="btn-primary" style={{ display: "inline-flex", marginTop: "8px" }}>
              Get Started Free
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M3.75 9H14.25M9.75 4.5L14.25 9L9.75 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div className="benefits-right">
            <div className="benefit-item bad">
              <div className="benefit-icon-bad">✕</div>
              <div>
                <strong>No server setup</strong>
                <p>Forget SSH, root access, and server configs forever.</p>
              </div>
            </div>
            <div className="benefit-item bad">
              <div className="benefit-icon-bad">✕</div>
              <div>
                <strong>No dependency install</strong>
                <p>We handle npm install, pip, bundler — all of it.</p>
              </div>
            </div>
            <div className="benefit-item bad">
              <div className="benefit-icon-bad">✕</div>
              <div>
                <strong>No config headache</strong>
                <p>No env files, no Dockerfile, no CI/CD pipelines to write.</p>
              </div>
            </div>
            <div className="benefit-item good">
              <div className="benefit-icon-good">✓</div>
              <div>
                <strong>Fully automatic deploy</strong>
                <p>Push code → we build, deploy, and give you a live URL.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="contact-card">

          <div className="contact-top">
            <div className="contact-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="contact-live-badge">
              <span className="badge-pulse" />
              We reply within 24 hours
            </div>
          </div>

          <h2>Get in Touch</h2>
          <p>Have questions, feedback, or need help? Our support team is ready to assist you every step of the way.</p>

          <a href="mailto:support@autodeploy.com" className="contact-email">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            support@autodeploy.com
          </a>

          <div className="contact-divider" />

          <div className="contact-meta-row">
            <div className="contact-meta-item">
              <div className="contact-meta-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <span className="contact-meta-label">Response Time</span>
                <span className="contact-meta-value">Under 24 hours</span>
              </div>
            </div>
            <div className="contact-meta-sep" />
            <div className="contact-meta-item">
              <div className="contact-meta-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <span className="contact-meta-label">Support Days</span>
                <span className="contact-meta-value">7 days a week</span>
              </div>
            </div>
            <div className="contact-meta-sep" />
            <div className="contact-meta-item">
              <div className="contact-meta-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <span className="contact-meta-label">Channel</span>
                <span className="contact-meta-value">Email & Chat</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src={logo} alt="logo" className="footer-logo" />
            <span className="brand-name" style={{ fontSize: "0.88rem" }}>Project Auto<span className="brand-accent">Deploy</span>ment System</span>
          </div>
          <p>© 2026 Project Auto Deployment System. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
