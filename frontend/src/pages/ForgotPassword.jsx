import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import logo from "../assets/logo/Autodeployment.png";
import "../styles/auth.css";

export default function ForgotPassword() {
  const { forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  /* SEND CODE */
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("Verification code sent to your email");
      setStep(2);
      setTimer(30);
    } catch (err) {
      toast.error(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  /* RESEND */
  const handleResend = async () => {
    try {
      await forgotPassword(email);
      toast.success("New verification code sent");
      setTimer(30);
    } catch {
      toast.error("Failed to resend code");
    }
  };

  /* VERIFY CODE */
  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (timer === 0) {
      toast.error("Code expired. Please resend.");
      return;
    }
    if (code.length < 6) {
      toast.error("Enter valid 6 digit code");
      return;
    }
    toast.success("Code verified");
    setStep(3);
  };

  /* RESET PASSWORD */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await confirmForgotPassword(email, code, password);
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  /* Step label helper */
  const stepLabel = step === 1 ? "Enter Email" : step === 2 ? "Verify Code" : "New Password";

  return (
    <div className="auth-page">
      {/* Navbar — identical to Login */}
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

      {/* Animated background grid — identical to Login */}
      <div className="auth-grid" />

      {/* Card */}
      <div className="auth-card">
        {/* Heading */}
        <div className="welcome-row">
          <h2 className="welcome-title">
            Reset <span>Password</span>
          </h2>
          <span className="auth-subtitle">{stepLabel} — Step {step} of 3</span>
        </div>

        {/* STEP 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending…" : "Send Code →"}
            </button>
          </form>
        )}

        {/* STEP 2 — Verify Code */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="auth-form">
            <p className="attempt-warning" style={{ marginBottom: "12px" }}>
              Code sent to <b>{email}</b>
            </p>

            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={timer === 0}
              />
            </div>

            {timer > 0 ? (
              <p className="attempt-warning">⏳ Code expires in {timer}s</p>
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
              disabled={timer === 0}
              style={timer === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              Verify Code →
            </button>
          </form>
        )}

        {/* STEP 3 — New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Resetting…" : "Change Password →"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login" className="link">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
