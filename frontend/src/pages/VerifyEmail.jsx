// src/pages/VerifyEmail.jsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../assets/logo/Autodeployment.png";
import "../styles/auth.css";

export default function VerifyEmail() {

  const { confirmRegistration, resendConfirmationCode } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  /* TIMER */
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  /* VERIFY EMAIL */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (timer === 0) {
      toast.error("Code expired. Please resend.");
      return;
    }
    setLoading(true);
    try {
      await confirmRegistration(email, code);
      toast.success("Email verified successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* RESEND CODE */
  const handleResend = async () => {
    try {
      await resendConfirmationCode(email);
      toast.success("New verification code sent");
      setTimer(30);
    } catch (err) {
      toast.error("Failed to resend code");
    }
  };

  return (
    <div className="auth-page">

      {/* Navbar — same as Login */}
      <nav className="auth-navbar">
        <Link to="/" className="auth-nav-brand">
          <img src={logo} alt="logo" className="auth-nav-logo" />
          <span className="auth-nav-name">
            Project Auto<span className="auth-nav-accent">Deploy</span>ment System
          </span>
        </Link>
        <div className="auth-nav-links">
          <a href="/#home">Home</a>
          <a href="/#features">Features</a>
          <a href="/#how">How it works</a>
          <a href="/#contact">Contact</a>
        </div>
      </nav>

      {/* Animated background grid — same as Login */}
      <div className="auth-grid" />

      {/* Card */}
      <div className="auth-card">

        {/* Heading */}
        <div className="welcome-row">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Mail size={32} color="#6c7cff" />
            <h2 className="welcome-title" style={{ marginBottom: 0 }}>
              Check your <span>Email</span>
            </h2>
          </div>
          <span className="auth-subtitle" style={{ marginTop: "10px", display: "block" }}>
            We sent a verification code to <strong style={{ color: "#c9d1e8" }}>{email}</strong>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-group">
            <label>Verification Code</label>
            <input
              type="text"
              required
              placeholder="Enter 6-digit code"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value)}
              disabled={timer === 0}
            />
          </div>

          {timer > 0 ? (
            <p className="attempt-warning">⏳ Code expires in <b>{timer}s</b></p>
          ) : (
            <p className="lock-warning">
              🔒 Code expired.{" "}
              <button
                type="button"
                onClick={handleResend}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6c7cff",
                  cursor: "pointer",
                  fontSize: "13px",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Resend
              </button>
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || timer === 0}
            style={timer === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          >
            {loading ? "Verifying…" : "Verify Email →"}
          </button>

        </form>

        <p className="auth-footer">
          <Link to="/login" className="link">← Back to login</Link>
        </p>

      </div>
    </div>
  );
}
