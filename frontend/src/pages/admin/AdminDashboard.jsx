// src/pages/admin/AdminDashboard.jsx

import { useEffect, useState } from 'react';
import { adminGetUsers, adminGetProjects } from '../../api';
import { Users, FolderOpen, Activity, AlertTriangle, Wrench } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

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

  // ✅ STATUS NORMALIZATION
  const statusCounts = {
    running: 0,
    queued: 0,
    failed: 0,
    building: 0
  };

  projects.forEach(p => {
    let status = (p.status || '').toLowerCase().trim();

    if (status.includes('run')) status = 'running';
    else if (status.includes('queue')) status = 'queued';
    else if (status.includes('fail')) status = 'failed';
    else if (status.includes('build')) status = 'building';

    if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    }
  });

  const running = statusCounts.running;
  const queued = statusCounts.queued;
  const failed = statusCounts.failed;
  const building = statusCounts.building;

  // ✅ FORCE SHOW ALL 4 IN CHART
  const pieData = [
    { name: 'Running', value: running },
    { name: 'Queued', value: queued },
    { name: 'Failed', value: failed },
    { name: 'Building', value: building }
  ].map(item => ({
    ...item,
    displayValue: item.value,
    value: item.value === 0 ? 0.0001 : item.value // 👈 force render
  }));

 const COLORS = [
  '#059669', // Running (deep green)
  '#b45309', // Queued (dark amber)
  '#b91c1c', // Failed (deep red)
  '#4338ca'  // Building (dark indigo)
];
  // ✅ USER PROJECT DATA
  const userProjectData = users.map((u, i) => ({
    name: u.name,
    shortName: `${u.name?.slice(0, 6) || 'User'}-${i}`,
    projects: u.projectCount || 0
  }));

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">

      {/* 🔝 STATS */}
      <div className="stats-grid">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: '#6366f1' },
          { label: 'Total Projects', value: projects.length, icon: FolderOpen, color: '#0ea5e9' },
          { label: 'Running', value: running, icon: Activity, color: '#10b981' },
          { label: 'Queued', value: queued, icon: Activity, color: '#f59e0b' },
          { label: 'Building', value: building, icon: Wrench, color: '#6366f1' },
          { label: 'Failed', value: failed, icon: AlertTriangle, color: '#ef4444' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
            <div className="stat-icon" style={{ color }}>
              <Icon size={24} />
            </div>
            <span className="stat-value" style={{ color }}>{value}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* 📊 CHARTS */}
      <div className="admin-tables">

        {/* 🔥 DONUT CHART */}
        <div className="admin-section">
          <h3>Project Status Overview</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={3}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>

              {/* ✅ TOOLTIP WITH STATUS NAME */}
              <Tooltip
                formatter={(value, name, props) => [
                  props.payload.displayValue,
                  props.payload.name
                ]}
                contentStyle={{
                  background: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 🔥 BAR CHART */}
        <div className="admin-section">
          <h3>User Projects</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userProjectData}>
              <CartesianGrid stroke="#374151" strokeDasharray="3 3" />

              <XAxis
                dataKey="shortName"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />

              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />

              <Tooltip
                formatter={(value) => [`${value}`, "Projects"]}
                labelFormatter={(label) => `User: ${label}`}
                contentStyle={{
                  background: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />

              <Bar
                dataKey="projects"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                barSize={55}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
}