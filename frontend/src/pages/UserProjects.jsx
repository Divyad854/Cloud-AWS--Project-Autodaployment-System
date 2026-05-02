// src/pages/UserProjects.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, stopProject, restartProject, deleteProject } from '../api';
import StatusBadge from '../components/StatusBadge';
import {
  Rocket,
  RefreshCw,
  Trash2,
  ExternalLink,
  ScrollText,
  Activity,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

import '../styles/dashboard.css';

export default function UserProjects() {

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ================= FETCH ================= */
  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      const data = res.data.projects || [];

      setProjects(data);
      setFilteredProjects(data);

    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /* ================= FILTER ================= */
  useEffect(() => {
    let result = projects;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(p =>
        (p.status || '').toLowerCase().includes(statusFilter)
      );
    }

    setFilteredProjects(result);

  }, [search, statusFilter, projects]);

  /* ================= ACTIONS ================= */
  const handleStop = async (id) => {
    try {
      await stopProject(id);
      toast.success('Project stopped');
      fetchProjects();
    } catch {
      toast.error('Failed to stop project');
    }
  };

  const handleRestart = async (id) => {
    try {
      await restartProject(id);
      toast.success('Project restarting...');
      fetchProjects();
    } catch {
      toast.error('Failed to restart project');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;

    try {
      await deleteProject(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="dashboard">

      {/* 🔥 HEADER SAME AS DASHBOARD */}
      <div className="section-header">
        <h3>Your Projects</h3>

        <Link to="/deploy" className="btn-primary">
          <Plus size={16} /> New Deployment
        </Link>
      </div>

      {/* 🔥 FILTER BAR SAME STYLE */}
      <div className="dashboard-toolbar">
        <input
          type="text"
          placeholder="Search project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="all">All</option>
          <option value="run">Running</option>
          <option value="queue">Queued</option>
          <option value="build">Building</option>
          <option value="fail">Failed</option>
        </select>
      </div>

      {/* 🔥 CONTENT SAME UI */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <Rocket size={48} />
          <h3>No matching projects</h3>
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
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProjects.map(project => (
                <tr key={project.projectid}>

                  <td className="project-name">
                    <Rocket size={16} style={{ color: "#6366f1" }} />
                    {project.name}
                  </td>

                  <td>
                    <StatusBadge status={project.status} />
                  </td>

                  <td>{project.runtime}</td>

                  <td>
                    {project.deployUrl ? (
                      <a
                        href={project.deployUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="live-url"
                      >
                        <ExternalLink size={14} /> Open
                      </a>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>

                  <td>
                    <div className="action-buttons">

                      <Link to={`/logs/${project.projectid}`} className="icon-action">
                        <ScrollText size={15} />
                      </Link>

                      {project.status === 'running' ? (
                        <button
                          className="icon-action warning"
                          onClick={() => handleStop(project.projectid)}
                        >
                          <Activity size={15} />
                        </button>
                      ) : (
                        <button
                          className="icon-action success"
                          onClick={() => handleRestart(project.projectid)}
                        >
                          <RefreshCw size={15} />
                        </button>
                      )}

                      <button
                        className="icon-action danger"
                        onClick={() => handleDelete(project.projectid)}
                      >
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