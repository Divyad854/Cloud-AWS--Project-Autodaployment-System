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
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ code: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('Reset code sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await confirmForgotPassword(email, form.code, form.password);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Rocket size={32} />
          <span>CloudLaunch</span>
        </div>
        <h2>Reset Password</h2>

        {step === 1 ? (
          <>
            <p className="auth-subtitle">Enter your email to receive a reset code</p>
            <form onSubmit={handleSendCode} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input type="email" required placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-subtitle">Enter the code sent to {email}</p>
            <form onSubmit={handleReset} className="auth-form">
              <div className="form-group">
                <label>Verification Code</label>
                <input type="text" required placeholder="6-digit code" maxLength={6}
                  value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" required placeholder="Min. 8 characters"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" required placeholder="Repeat password"
                  value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
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
