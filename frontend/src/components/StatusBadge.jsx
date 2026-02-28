// src/components/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const map = {
    running: { label: 'Running', color: '#10b981' },
    building: { label: 'Building', color: '#f59e0b' },
    pending: { label: 'Pending', color: '#6366f1' },
    failed: { label: 'Failed', color: '#ef4444' },
    stopped: { label: 'Stopped', color: '#6b7280' },
  };
  const { label, color } = map[status?.toLowerCase()] || { label: status, color: '#6b7280' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '3px 10px', borderRadius: '20px',
      background: color + '22', color, fontSize: '0.78rem', fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}
