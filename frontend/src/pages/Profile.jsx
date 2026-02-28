// src/pages/Profile.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/profile.css';

export default function Profile() {
  const { userAttributes, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: userAttributes?.name || '',
    email: userAttributes?.email || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name: form.name });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {(userAttributes?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2>{userAttributes?.name}</h2>
            <p className="muted">{userAttributes?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <h3>Personal Information</h3>

          <div className="form-group">
            <label><User size={14} /> Full Name</label>
            <input type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="form-group">
            <label><Mail size={14} /> Email</label>
            <input type="email" value={form.email} disabled className="disabled-input"
              title="Email cannot be changed" />
            <small>Email address cannot be changed</small>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
