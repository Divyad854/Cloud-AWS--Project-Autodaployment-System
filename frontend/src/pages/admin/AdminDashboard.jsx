// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { adminGetUsers, adminGetProjects } from '../../api';
import { Users, FolderOpen, Activity, AlertTriangle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import '../../styles/admin.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminGetUsers(), adminGetProjects()])
      .then(([u, p]) => {
        setUsers(u.data.users || []);
        setProjects(p.data.projects || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const running = projects.filter(p => p.status === 'running').length;
  const failed = projects.filter(p => p.status === 'failed').length;

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div className="admin-dashboard">
      <div className="stats-grid">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: '#6366f1' },
          { label: 'Total Projects', value: projects.length, icon: FolderOpen, color: '#0ea5e9' },
          { label: 'Running', value: running, icon: Activity, color: '#10b981' },
          { label: 'Failed', value: failed, icon: AlertTriangle, color: '#ef4444' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
            <div className="stat-icon" style={{ color }}><Icon size={24} /></div>
            <span className="stat-value" style={{ color }}>{value}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="admin-tables">
        <div className="admin-section">
          <h3>Recent Projects</h3>
          <table className="projects-table">
            <thead>
              <tr><th>Project</th><th>User</th><th>Status</th><th>Runtime</th></tr>
            </thead>
            <tbody>
              {projects.slice(0, 10).map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="muted">{p.userEmail}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{p.runtime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-section">
          <h3>Recent Users</h3>
          <table className="projects-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Projects</th><th>Status</th></tr>
            </thead>
            <tbody>
              {users.slice(0, 10).map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="muted">{u.email}</td>
                  <td>{u.projectCount || 0}</td>
                  <td><span className={`status-pill ${u.status === 'active' ? 'success' : 'danger'}`}>{u.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
