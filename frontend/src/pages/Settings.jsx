// src/pages/Settings.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Shield, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/settings.css';

export default function Settings() {
  const { changePassword } = useAuth();
  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.new.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await changePassword(pwForm.old, pwForm.new);
      toast.success('Password changed successfully');
      setPwForm({ old: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-section-header">
          <Lock size={20} />
          <h3>Change Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="settings-form">
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" required placeholder="Enter current password"
              value={pwForm.old} onChange={(e) => setPwForm({ ...pwForm, old: e.target.value })} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" required placeholder="Min. 8 characters"
              value={pwForm.new} onChange={(e) => setPwForm({ ...pwForm, new: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" required placeholder="Repeat new password"
              value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      <div className="settings-card">
        <div className="settings-section-header">
          <Bell size={20} />
          <h3>Notifications</h3>
        </div>
        <div className="toggle-list">
          {[
            { label: 'Deployment success', desc: 'Get notified when a project deploys successfully' },
            { label: 'Deployment failure', desc: 'Get notified when a deployment fails' },
            { label: 'Health alerts', desc: 'Receive alerts when your apps go down' },
          ].map(({ label, desc }) => (
            <div key={label} className="toggle-item">
              <div>
                <p className="toggle-label">{label}</p>
                <p className="toggle-desc">{desc}</p>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-card danger-zone">
        <div className="settings-section-header">
          <Shield size={20} />
          <h3>Danger Zone</h3>
        </div>
        <div className="danger-item">
          <div>
            <p>Delete Account</p>
            <p className="muted">Permanently delete your account and all projects</p>
          </div>
          <button className="btn-danger" onClick={() => toast.error('Contact admin to delete account')}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
