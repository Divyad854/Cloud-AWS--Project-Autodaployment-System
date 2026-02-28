// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Rocket, ScrollText, User,
  Settings, LogOut, Users, FolderOpen, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import '../styles/sidebar.css';

const userNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/deploy', icon: Rocket, label: 'Deploy' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/admin/logs', icon: FileText, label: 'System Logs' },
];

export default function Sidebar({ admin }) {
  const { logout, userAttributes } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = admin ? adminNav : userNav;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Rocket size={24} className="logo-icon" />
          {!collapsed && <span className="logo-text">CloudLaunch</span>}
        </div>
        {admin && !collapsed && <span className="admin-badge">Admin</span>}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="user-info">
            <div className="user-avatar">
              {(userAttributes?.name || userAttributes?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{userAttributes?.name || 'User'}</span>
              <span className="user-email">{userAttributes?.email}</span>
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
