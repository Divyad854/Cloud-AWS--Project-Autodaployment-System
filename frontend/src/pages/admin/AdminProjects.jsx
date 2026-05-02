import { useEffect, useState } from 'react';
import { adminGetProjects, adminStopProject, adminDeleteProject } from '../../api';
import { Square, Trash2, Search, ExternalLink, Filter } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import '../../styles/admin.css';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // New filter state
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await adminGetProjects();
      const data = res.data.projects || [];
      setProjects(data);
      setFiltered(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Combined Search and Status Filtering
  useEffect(() => {
    const q = search.toLowerCase();
    
    const results = projects.filter((p) => {
      const matchesSearch = 
        p.name?.toLowerCase().includes(q) ||
        (p.userEmail || p.partitionid)?.toLowerCase().includes(q);
      
      const matchesStatus = 
        statusFilter === 'all' || 
        p.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    setFiltered(results);
  }, [search, statusFilter, projects]);

  const handleStop = async (project) => {
    try {
      await adminStopProject(project.partitionid, project.projectid);
      toast.success('Project stopped');
      fetchProjects();
    } catch {
      toast.error('Failed to stop project');
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await adminDeleteProject(project.partitionid, project.projectid);
      toast.success('Project deleted');
      setProjects((prev) =>
        prev.filter((p) => !(p.projectid === project.projectid && p.partitionid === project.partitionid))
      );
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="filter-box">
            <Filter size={16} className="filter-icon" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-select"
            >
              <option value="all">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="building">Building</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <span className="muted">{filtered.length} projects</span>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : (
        <table className="projects-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Runtime</th>
              <th>Live URL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={`${p.partitionid}-${p.projectid}`}>
                <td><strong>{p.name}</strong></td>
                <td className="muted">{p.userEmail || p.partitionid}</td>
                <td><StatusBadge status={p.status} /></td>
                <td>{p.runtime}</td>
                <td>
                  {p.deployUrl ? (
                    <a href={p.deployUrl} target="_blank" rel="noreferrer" className="live-url">
                      <ExternalLink size={13} /> Open
                    </a>
                  ) : <span className="muted">—</span>}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="icon-action danger" title="Delete" onClick={() => handleDelete(p)}>
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