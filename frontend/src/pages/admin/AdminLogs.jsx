// src/pages/admin/AdminLogs.jsx
import { useEffect, useState } from 'react';
import { adminGetSystemLogs } from '../../api';
import { RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/admin.css';

export default function AdminLogs() {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminGetSystemLogs();
      setLogs(res.data.logs || 'No system logs available.');
    } catch { toast.error('Failed to fetch logs'); setLogs('Error loading logs.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="admin-page">
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} />
          <strong>System Activity Logs</strong>
        </div>
        <button className="btn-icon" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>
      <div className="logs-terminal">
        <div className="terminal-header">
          <FileText size={16} />
          <span>System Logs</span>
        </div>
        <pre className="terminal-body">{loading ? 'Loading...' : logs}</pre>
      </div>
    </div>
  );
}
