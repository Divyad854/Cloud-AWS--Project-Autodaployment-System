
// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getProjects, stopProject, restartProject, deleteProject } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Rocket, Square, RefreshCw, Trash2, ExternalLink, ScrollText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import '../styles/dashboard.css';
import { Folder, Activity,Loader, Hammer, XCircle } from "lucide-react";
export default function Dashboard() {

  const { userAttributes, isAdmin } = useAuth();

  // 🔒 Block admin from accessing user dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

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

  // ✅ running = deployed (has URL OR status running)
  running: data.filter(
    p => p.status === 'running' || (p.deployUrl && p.deployUrl !== "")
  ).length,

  // ✅ building = queued
  building: data.filter(
    p => p.status === 'queued' || p.status === 'building'
  ).length,

  failed: data.filter(p => p.status === 'failed').length,
});

    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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
    if (!confirm('Delete this project? This cannot be undone.')) return;

    try {
      await deleteProject(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="dashboard">

      <div className="dashboard-welcome">
        <h2>
          Welcome back, {userAttributes?.name?.split(' ')[0] || 'there'} 👋
        </h2>
        <p>Here's an overview of your deployments</p>
      </div>



<div className="stats-grid">
  {[
    { label: 'Total Projects', value: stats.total, color: '#6366f1', icon: Folder },
    { label: 'Running', value: stats.running, color: '#10b981', icon: Activity },
    { label: 'Building', value: stats.building, color: '#f59e0b', icon: Loader, spin: true },
    { label: 'Failed', value: stats.failed, color: '#ef4444', icon: XCircle },
  ].map(({ label, value, color, icon: Icon, spin }) => (
    <div key={label} className="stat-card">

      {/* 🔥 ICON + NUMBER */}
      <div className="stat-top">
        <Icon
          size={22}
          style={{ color }}
          className={spin ? "animate-spin" : ""}
        />
        <span className="stat-value" style={{ color }}>
          {value}
        </span>
      </div>

      {/* 🔥 LABEL */}
      <div className="stat-label">{label}</div>
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

        <div className="loading-state">
          <div className="spinner" />
        </div>

      ) : projects.length === 0 ? (

        <div className="empty-state">
          <Rocket size={48} />
          <h3>No projects yet</h3>
          <p>Deploy your first project to get started</p>

          <Link to="/deploy" className="btn-primary">
            Deploy Now
          </Link>
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
  {project.deployUrl &&
   project.deployUrl !== "null" &&
   project.deployUrl !== "undefined" &&
   project.deployUrl.trim() !== "" ? (

    <a
      href={
        project.deployUrl.startsWith("http")
          ? project.deployUrl
          : `http://${project.deployUrl}`
      }
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

      <td className="muted">
        {project.createdAt
          ? new Date(project.createdAt).toLocaleDateString()
          : '—'}
      </td>

      <td>

        <div className="action-buttons">

          <Link
            to={`/logs/${project.projectid}`}
            className="icon-action"
          >
            <ScrollText size={15} />
          </Link>

          {project.status === 'running' ? (

            <button
              className="icon-action warning"
              onClick={() => handleStop(project.projectid)}
            >
              <Activity  size={15} />
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
