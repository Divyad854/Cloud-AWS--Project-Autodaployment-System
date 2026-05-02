import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getNotifications } from '../api';
import api from '../api';
import '../styles/navbar.css';

const routeTitles = {
  '/app/dashboard': 'Dashboard',
  '/app/deploy': 'Deploy Project',
  '/app/logs': 'Logs',
  '/app/profile': 'Profile',
  '/app/settings': 'Settings',
  '/app/notifications': 'Notifications',

  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/projects': 'Project Management',
  '/admin/logs': 'System Logs',
  '/admin/profile': 'Profile',
  '/admin/notifications': 'Notifications',
};

export default function Navbar() {

  const location = useLocation();
  const navigate = useNavigate();
  const { userAttributes, isAdmin } = useAuth();

  /* 🔥 HANDLE DYNAMIC ROUTES (logs/:id) */
  const getTitle = () => {
    const path = location.pathname;

    if (path.startsWith('/app/logs')) return 'Logs';
    if (path.startsWith('/app/profile')) return 'Profile';
    if (path.startsWith('/app/notifications')) return 'Notifications';

    return routeTitles[path] || 'Cloud AutoDeployment System';
  };

  const title = getTitle();

  const [avatar, setAvatar] = useState("");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadProfile();
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/user/profile"); // 🔥 FIXED API PATH
      setAvatar(res.data?.profile?.profilePhotoUrl || "");
    } catch {
      console.log("Profile error");
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res?.data?.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch {}
  };

  return (
    <header className="navbar">

      {/* LEFT */}
      <div className="navbar-left">
        <h1 className="page-title">{title}</h1>
      </div>

      {/* RIGHT */}
      <div className="navbar-right">

        {/* SEARCH (ADMIN ONLY) */}
        {location.pathname === '/admin/projects' && (
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search projects..." />
          </div>
        )}

        {/* 🔔 NOTIFICATIONS */}
        <button
          className="icon-btn"
          onClick={() =>
            navigate(isAdmin ? '/admin/notifications' : '/app/notifications')
          }
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="badge">{notifications.length}</span>
          )}
        </button>

        {/* 👤 PROFILE */}
        <Link
          to={isAdmin ? '/admin/profile' : '/app/profile'}
          className="nav-avatar"
        >
          {avatar ? (
            <img src={avatar} alt="profile" />
          ) : (
            (userAttributes?.name || 'U')[0].toUpperCase()
          )}
        </Link>

      </div>
    </header>
  );
}