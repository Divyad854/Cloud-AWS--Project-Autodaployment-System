
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import logo from '../assets/logo/Autodeployment.png';
import '../styles/auth.css';

export default function Register() {

  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {

      const result = await register(form.email, form.password, form.name);

      /* 🔥 CREATE USER IN DYNAMODB */
      await axios.post('/api/users/create', {
        id: result?.userId || result?.user?.userId,
        name: form.name,
        email: form.email
      });

      toast.success('Account created! Please verify your email.');

      navigate('/verify-email', { state: { email: form.email } });

    } catch (err) {

      toast.error(err.message || 'Registration failed');

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="auth-page">

      <div className="auth-card">

        {/* 🔥 Logo Section */}
        <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
      marginBottom: "20px",
    }}
  >
    <img
      src={logo}
      alt="logo"
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "10px",
      }}
    />

    <h2
      style={{
        fontSize: "20px",
        fontWeight: "600",
      }}
    >
      Project Deployment System
    </h2>
  </div>

        <div className="welcome-row">
          <h2 className="welcome-title">Create account</h2>
          <span className="auth-subtitle">Start deploying in minutes</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              required
              placeholder="Riva Vora"
              pattern="[A-Za-z ]+"
              title="Name can contain only letters and spaces"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              title="Enter a valid email address"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="input-with-icon">

              <input
                type={showPw ? 'text' : 'password'}
                required
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
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

          <div className="form-group">
            <label>Confirm Password</label>

            <input
              type="password"
              required
              placeholder="Repeat password"
              value={form.confirm}
              onChange={(e) =>
                setForm({ ...form, confirm: e.target.value })
              }
            />

          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >

            {loading ? 'Creating account...' : 'Create Account'}

          </button>

        </form>

        <p className="auth-footer">

          Already have an account?{' '}

          <Link to="/login" className="link">
            Sign in
          </Link>

        </p>

      </div>

    </div>

  );

}