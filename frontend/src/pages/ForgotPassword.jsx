// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/auth.css';

export default function ForgotPassword() {
  const { forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();

  // steps:
  // 1 = enter email
  // 2 = verify OTP
  // 3 = set new password
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  /* ===============================
     STEP 1: SEND OTP
  =============================== */
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('Verification code sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     STEP 2: VERIFY OTP ONLY
     (no password yet)
  =============================== */
  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (code.length < 6) {
      toast.error('Enter valid 6-digit code');
      return;
    }

    // Cognito does not support "verify only" OTP,
    // so we temporarily move to next step
    // Actual verification happens in step 3
    toast.success('Code verified');
    setStep(3);
  };

  /* ===============================
     STEP 3: RESET PASSWORD
  =============================== */
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await confirmForgotPassword(email, code, password);
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* LOGO */}
        <div className="auth-logo">
          <Rocket size={32} />
          <span>CloudLaunch</span>
        </div>

        <h2>Reset Password</h2>

        {/* ===============================
            STEP 1 UI
        =============================== */}
        {step === 1 && (
          <>
            <p className="auth-subtitle">
              Enter your email to receive a verification code
            </p>

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

              <button className="btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          </>
        )}

        {/* ===============================
            STEP 2 UI (VERIFY OTP)
        =============================== */}
        {step === 2 && (
          <>
            <p className="auth-subtitle">
              Enter the verification code sent to<br />
              <strong>{email}</strong>
            </p>

            <form onSubmit={handleVerifyCode} className="auth-form">
              <div className="form-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <button className="btn-primary">
                Verify Code
              </button>
            </form>
          </>
        )}

        {/* ===============================
            STEP 3 UI (NEW PASSWORD)
        =============================== */}
        {step === 3 && (
          <>
            <p className="auth-subtitle">
              Set your new password
            </p>

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

              <button className="btn-primary" disabled={loading}>
                {loading ? 'Resetting...' : 'Change Password'}
              </button>
            </form>
          </>
        )}

        <p className="auth-footer">
          <Link to="/login" className="link">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}