// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../assets/logo/Autodeployment.png';
import '../styles/auth.css';

export default function Login() {
  const { login, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔐 Login attempt states
  const [attempts, setAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [lockTime, setLockTime] = useState(0);
  const [lockLevel, setLockLevel] = useState(1);

  // 🔁 Redirect when logged in
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isAdmin, navigate]);

  // ⏳ Countdown timer
  useEffect(() => {
    let timer;
    if (lockTime > 0) {
      timer = setInterval(() => {
        setLockTime((prev) => prev - 1);
      }, 1000);
    } else if (lockTime === 0 && remainingAttempts === 0) {
      setRemainingAttempts(1);
    }
    return () => clearInterval(timer);
  }, [lockTime, remainingAttempts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (remainingAttempts <= 0) return;

    setLoading(true);

    try {
      const result = await login(form.email, form.password);

      if (result?.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        navigate('/verify-email', { state: { email: form.email } });
        return;
      }

      // ✅ Reset on success
      setAttempts(0);
      setRemainingAttempts(3);
      setLockLevel(1);

      toast.success('Welcome back!');

    }catch (err) {

  console.log("LOGIN ERROR:", err);

  // 🔴 BLOCKED USER CHECK
  if (
    err.name === "UserDisabledException" ||
    err.message?.includes("disabled")
  ) {
    toast.error("Your account has been blocked by admin.");
    return;
  }

  const newAttempts = attempts + 1;
  setAttempts(newAttempts);

  const newRemaining = remainingAttempts - 1;
  setRemainingAttempts(newRemaining);

  toast.error(
    `Login failed. ${
      newRemaining > 0
        ? `${newRemaining} attempt(s) remaining.`
        : "Too many attempts!"
    }`
  );

  if (newRemaining === 0) {
    const lockSeconds = 30 * lockLevel;
    setLockTime(lockSeconds);
    setLockLevel(lockLevel + 1);
  }

}finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
<div className="auth-logo">
  <img src={logo} alt="Auto Deployment Logo" className="logo-img" />
  <h1 className="project-title">Project Deployment System</h1>
</div>

      <div className="welcome-row">
  <h2 className="welcome-title">Welcome back</h2>
  <span className="auth-subtitle">Sign in to your account</span>
</div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              disabled={lockTime > 0}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <input
                type={showPw ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                disabled={lockTime > 0}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-row">
            <Link to="/forgot-password" className="link">
              Forgot password?
            </Link>
          </div>

          {remainingAttempts > 0 && attempts > 0 && (
            <p className="attempt-warning">
              Remaining Attempts: {remainingAttempts}
            </p>
          )}

          {lockTime > 0 && (
            <p className="lock-warning">
              Too many failed attempts. Try again in {lockTime} seconds.
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || lockTime > 0}
          >
            {loading
              ? 'Signing in...'
              : lockTime > 0
              ? `Locked (${lockTime}s)`
              : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="link">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}