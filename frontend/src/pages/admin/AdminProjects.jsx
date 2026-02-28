// src/pages/admin/AdminProjects.jsx
import { useEffect, useState } from 'react';
import { adminGetProjects, adminStopProject, adminDeleteProject } from '../../api';
import { Square, Trash2, Search, ExternalLink } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import '../../styles/admin.css';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await adminGetProjects();
      const data = res.data.projects || [];
      setProjects(data);
      setFiltered(data);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(projects.filter(p =>
      p.name?.toLowerCase().includes(q) || p.userEmail?.toLowerCase().includes(q)
    ));
  }, [search, projects]);

  const handleStop = async (id) => {
    try {
      await adminStopProject(id);
      toast.success('Project stopped');
      fetchProjects();
    } catch { toast.error('Failed to stop project'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await adminDeleteProject(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch { toast.error('Failed to delete project'); }
  };

  return (
    <div className="admin-page">
      <div className="page-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search projects..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="muted">{filtered.length} projects</span>
      </div>

      {loading ? <div className="loading-state"><div className="spinner" /></div> : (
        <table className="projects-table">
          <thead>
            <tr><th>Project</th><th>Owner</th><th>Status</th><th>Runtime</th><th>Live URL</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td className="muted">{p.userEmail}</td>
                <td><StatusBadge status={p.status} /></td>
                <td>{p.runtime}</td>
                <td>
                  {p.liveUrl ? (
                    <a href={p.liveUrl} target="_blank" rel="noreferrer" className="live-url">
                      <ExternalLink size={13} /> Open
                    </a>
                  ) : <span className="muted">—</span>}
                </td>
                <td>
                  <div className="action-buttons">
                    {p.status === 'running' && (
                      <button className="icon-action warning" title="Stop" onClick={() => handleStop(p.id)}>
                        <Square size={15} />
                      </button>
                    )}
                    <button className="icon-action danger" title="Delete" onClick={() => handleDelete(p.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
