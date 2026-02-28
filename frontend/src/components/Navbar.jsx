// src/components/Navbar.jsx
import { useLocation, Link } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/navbar.css';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/deploy': 'Deploy Project',
  '/logs': 'Logs',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/projects': 'Project Management',
  '/admin/logs': 'System Logs',
};

export default function Navbar() {
  const location = useLocation();
  const { userAttributes } = useAuth();
  const title = routeTitles[location.pathname] || 'CloudLaunch';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="navbar-right">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search projects..." />
        </div>
        <button className="icon-btn" title="Notifications">
          <Bell size={20} />
          <span className="badge">3</span>
        </button>
        <Link to="/profile" className="nav-avatar">
          {(userAttributes?.name || 'U')[0].toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
