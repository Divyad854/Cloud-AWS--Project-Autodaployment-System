// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Deploy from './pages/Deploy';
import Logs from './pages/Logs';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProjects from './pages/admin/AdminProjects';
import AdminLogs from './pages/admin/AdminLogs';

/* ================= ROUTE GUARDS ================= */

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

function PublicRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (user) {
    return isAdmin
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/dashboard" replace />;
  }

  return children;
}

/* ================= APP ================= */

function AppRoutes() {
  const { isAdmin } = useAuth();

  return (
    <Routes>
      {/* -------- PUBLIC -------- */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* -------- USER -------- */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route
          index
          element={
            isAdmin
              ? <Navigate to="/admin/dashboard" replace />
              : <Navigate to="/dashboard" replace />
          }
        />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="deploy" element={<Deploy />} />
        <Route path="logs/:projectId?" element={<Logs />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* -------- ADMIN -------- */}
      <Route path="/admin" element={<AdminRoute><Layout admin /></AdminRoute>}>
        <Route path="profile" element={<Profile />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>

      {/* -------- FALLBACK -------- */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}