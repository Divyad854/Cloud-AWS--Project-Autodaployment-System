// src/pages/Dashboard.jsx

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getProjects } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

import '../styles/dashboard.css';
import { Folder, Loader, Hammer, XCircle, Activity } from "lucide-react";

/* 🔥 CHARTS */
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {

  const { userAttributes, isAdmin } = useAuth();

  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    queued: 0,
    building: 0,
    failed: 0
  });

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getProjects();
        const data = res.data.projects || [];

        setProjects(data);

        setStats({
          total: data.length,
          running: data.filter(p => p.status?.includes('run')).length,
          queued: data.filter(p => p.status?.includes('queue')).length,
          building: data.filter(p => p.status?.includes('build')).length,
          failed: data.filter(p => p.status?.includes('fail')).length,
        });

      } catch {
        toast.error('Failed to load dashboard');
      }
    };

    fetchProjects();
  }, []);

  /* 🔥 PIE DATA */
  const pieData = [
    { name: 'Running', value: stats.running },
    { name: 'Queued', value: stats.queued },
    { name: 'Building', value: stats.building },
    { name: 'Failed', value: stats.failed },
  ];

  /* 🔥 RUNTIME AREA DATA */
  const getRuntimeData = () => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const label = date.toLocaleDateString('en-IN', { weekday: 'short' });

      const dayProjects = projects.filter(p => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        return d.toDateString() === date.toDateString();
      });

      days.push({
        name: label,
        Node: dayProjects.filter(p => p.runtime?.toLowerCase().includes("node")).length,
        Java: dayProjects.filter(p => p.runtime?.toLowerCase().includes("java")).length,
        Python: dayProjects.filter(p => p.runtime?.toLowerCase().includes("python")).length
      });
    }

    return days;
  };

  const runtimeData = getRuntimeData();

  /* 🔥 ✅ UPDATED BAR DATA (ONLY DEPLOYMENTS) */
  const getLast7DaysData = () => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const label = date.toLocaleDateString('en-IN', { weekday: 'short' });

      const dayProjects = projects.filter(p => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        return d.toDateString() === date.toDateString();
      });

      days.push({
        name: label,
        Deployments: dayProjects.length   // ✅ only total deployments
      });
    }

    return days;
  };

  const weeklyData = getLast7DaysData();

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dashboard-welcome">
        <h2>Welcome back, {userAttributes?.name?.split(' ')[0] || 'there'} 👋</h2>
        <p>Here's an overview of your deployments</p>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        {[
          { label: 'Total Projects', value: stats.total, color: '#6366f1', icon: Folder },
          { label: 'Running', value: stats.running, color: '#10b981', icon: Activity },
          { label: 'Queued', value: stats.queued, color: '#f59e0b', icon: Loader },
          { label: 'Building', value: stats.building, color: '#6366f1', icon: Hammer },
          { label: 'Failed', value: stats.failed, color: '#ef4444', icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="stat-top">
              <Icon size={22} style={{ color }} />
              <span className="stat-value" style={{ color }}>{value}</span>
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="charts-grid">

        {/* 🔥 DONUT CHART */}
        <div className="chart-container">
          <h3>Project Status</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#6366f1" />
                <Cell fill="#ef4444" />
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 🔥 AREA CHART */}
        <div className="chart-container">
          <h3>Runtime Distribution</h3>

          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={runtimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />

              <Area type="monotone" dataKey="Node" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3}/>
              <Area type="monotone" dataKey="Java" stroke="#10b981" fill="#10b981" fillOpacity={0.3}/>
              <Area type="monotone" dataKey="Python" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* 🔥 ✅ UPDATED BAR CHART */}
      <div className="chart-container">
        <h3>Deployments (Last 7 Days)</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="4 4" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />

            {/* ✅ ONLY ONE BAR */}
            <Bar dataKey="Deployments" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}