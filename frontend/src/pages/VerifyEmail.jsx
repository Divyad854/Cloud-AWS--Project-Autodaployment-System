// src/pages/VerifyEmail.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Rocket } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/auth.css';

export default function VerifyEmail() {
  const { confirmRegistration } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmRegistration(email, code);
      toast.success('Email verified! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Verification failed');
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
        <div className="verify-icon"><Mail size={48} /></div>
        <h2>Check your email</h2>
        <p className="auth-subtitle">
          We sent a verification code to <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Verification Code</label>
            <input
              type="text" required placeholder="Enter 6-digit code"
              value={code} onChange={(e) => setCode(e.target.value)}
              maxLength={6} className="code-input"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      </div>
    </div>
  );
}
