import { useLocation, Link } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchAuthSession } from "aws-amplify/auth";
import '../styles/navbar.css';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/deploy': 'Deploy Project',
  '/logs': 'Logs',
  '/profile': 'Profile',
  '/admin/profile': 'Profile',
  '/settings': 'Settings',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/projects': 'Project Management',
  '/admin/logs': 'System Logs',
};

export default function Navbar() {

  const location = useLocation();
  const { userAttributes, isAdmin } = useAuth();
  const title = routeTitles[location.pathname] || 'Cloud AutoDeployment System';

  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function getToken() {

    const session = await fetchAuthSession();
    return session?.tokens?.idToken?.toString();

  }

  const loadProfile = async () => {

    try {

      const token = await getToken();

      const res = await axios.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAvatar(res.data?.profile?.profilePhotoUrl || "");

    } catch (err) {
      console.error("Navbar profile load error:", err);
    }

  };

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

        <Link to={isAdmin ? '/admin/profile' : '/profile'} className="nav-avatar">

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