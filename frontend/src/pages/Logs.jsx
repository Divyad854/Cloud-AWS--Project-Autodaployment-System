// src/pages/Logs.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjects, getBuildLogs, getRuntimeLogs } from '../api';
import { RefreshCw, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/logs.css';

export default function Logs() {
  const { projectId } = useParams();
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(projectId || '');
  const [logType, setLogType] = useState('build');
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProjects().then(r => {
      setProjects(r.data.projects || []);
      if (!selectedId && r.data.projects?.[0]) setSelectedId(r.data.projects[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedId) fetchLogs();
  }, [selectedId, logType]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const fn = logType === 'build' ? getBuildLogs : getRuntimeLogs;
      const res = await fn(selectedId);
      setLogs(res.data.logs || 'No logs available.');
    } catch {
      setLogs('Failed to fetch logs. Check your deployment status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logs-page">
      <div className="logs-controls">
        <div className="form-group">
          <label>Project</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select project...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="log-type-tabs">
          <button className={logType === 'build' ? 'active' : ''} onClick={() => setLogType('build')}>
            Build Logs
          </button>
          <button className={logType === 'runtime' ? 'active' : ''} onClick={() => setLogType('runtime')}>
            Runtime Logs
          </button>
        </div>

        <button className="btn-icon" onClick={fetchLogs} disabled={loading} title="Refresh">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="logs-terminal">
        <div className="terminal-header">
          <Terminal size={16} />
          <span>{logType === 'build' ? 'Build' : 'Runtime'} Logs</span>
          {selectedId && <span className="terminal-project">
            {projects.find(p => p.id === selectedId)?.name}
          </span>}
        </div>
        <pre className="terminal-body">
          {loading ? 'Loading logs...' : logs || 'Select a project to view logs.'}
        </pre>
      </div>
    </div>
  );
}
