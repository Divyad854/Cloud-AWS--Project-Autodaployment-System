// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, stopProject, restartProject, deleteProject } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Rocket, Square, RefreshCw, Trash2, ExternalLink, ScrollText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { userAttributes } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, running: 0, failed: 0, building: 0 });

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      const data = res.data.projects || [];
      setProjects(data);
      setStats({
        total: data.length,
        running: data.filter(p => p.status === 'running').length,
        failed: data.filter(p => p.status === 'failed').length,
        building: data.filter(p => p.status === 'building').length,
      });
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleStop = async (id) => {
    try {
      await stopProject(id);
      toast.success('Project stopped');
      fetchProjects();
    } catch { toast.error('Failed to stop project'); }
  };

  const handleRestart = async (id) => {
    try {
      await restartProject(id);
      toast.success('Project restarting...');
      fetchProjects();
    } catch { toast.error('Failed to restart project'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await deleteProject(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch { toast.error('Failed to delete project'); }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-welcome">
        <h2>Welcome back, {userAttributes?.name?.split(' ')[0] || 'there'} 👋</h2>
        <p>Here's an overview of your deployments</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Projects', value: stats.total, color: '#6366f1' },
          { label: 'Running', value: stats.running, color: '#10b981' },
          { label: 'Building', value: stats.building, color: '#f59e0b' },
          { label: 'Failed', value: stats.failed, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
            <span className="stat-value" style={{ color }}>{value}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="section-header">
        <h3>Your Projects</h3>
        <Link to="/deploy" className="btn-primary">
          <Plus size={16} /> New Deployment
        </Link>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <Rocket size={48} />
          <h3>No projects yet</h3>
          <p>Deploy your first project to get started</p>
          <Link to="/deploy" className="btn-primary">Deploy Now</Link>
        </div>
      ) : (
        <div className="projects-table-wrap">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Status</th>
                <th>Runtime</th>
                <th>Live URL</th>
                <th>Deployed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id}>
                  <td className="project-name">
                    <Rocket size={16} />
                    {project.name}
                  </td>
                  <td><StatusBadge status={project.status} /></td>
                  <td>{project.runtime}</td>
                  <td>
                    {project.liveUrl ? (
                      <a href={project.liveUrl} target="_blank" rel="noreferrer" className="live-url">
                        <ExternalLink size={14} /> Open
                      </a>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td className="muted">{project.deployedAt ? new Date(project.deployedAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/logs/${project.id}`} className="icon-action" title="Logs">
                        <ScrollText size={15} />
                      </Link>
                      {project.status === 'running' ? (
                        <button className="icon-action warning" title="Stop" onClick={() => handleStop(project.id)}>
                          <Square size={15} />
                        </button>
                      ) : (
                        <button className="icon-action success" title="Restart" onClick={() => handleRestart(project.id)}>
                          <RefreshCw size={15} />
                        </button>
                      )}
                      <button className="icon-action danger" title="Delete" onClick={() => handleDelete(project.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
