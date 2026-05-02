import axios from 'axios';
import * as Auth from '@aws-amplify/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

/* ================= AUTH INTERCEPTOR ================= */

api.interceptors.request.use(async (config) => {
  try {
    const session = await Auth.fetchAuthSession();
    let token;

    if (typeof session?.getIdToken === 'function') {
      token = session.getIdToken()?.getJwtToken?.();
    }

    if (!token && session?.tokens?.idToken) {
      if (typeof session.tokens.idToken.toString === 'function') {
        token = session.tokens.idToken.toString();
      } else if (session.tokens.idToken?.jwtToken) {
        token = session.tokens.idToken.jwtToken;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Auth session not available', err?.message || err);
  }
  return config;
});

/* ================= PROJECTS ================= */

export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const deployProject = (data) => api.post('/deploy', data);
export const redeployProject = (id) => api.post(`/projects/${id}/redeploy`);
export const stopProject = (id) => api.post(`/projects/${id}/stop`);
export const restartProject = (id) =>
  api.post(`/projects/${id}/restart`);
export const deleteProject = (id) =>
  api.delete(`/projects/${id}`);

/* ================= NOTIFICATIONS ================= */

export const getNotifications = () => api.get('/notifications');
export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`);

/* ================= LOGS ================= */

// ✅ Build logs
export const getBuildLogs = (id) =>
  api.get(`/projects/${id}/logs/build`);

// ✅ Runtime logs
export const getRuntimeLogs = (id) =>
  api.get(`/logs/runtime/${id}`);

/* ================= ADMIN ================= */

export const adminGetUsers = () => api.get('/admin/users');
export const adminGetProjects = () => api.get('/admin/projects');

export const adminBlockUser = (userId) =>
  api.post(`/admin/users/${userId}/block`);

export const adminUnblockUser = (userId) =>
  api.post(`/admin/users/${userId}/unblock`);

export const adminDeleteUser = (userId) =>
  api.delete(`/admin/users/${userId}`);

export const adminStopProject = (partitionId, projectId) =>
  api.post(`/admin/projects/${partitionId}/${projectId}/stop`);

export const adminDeleteProject = (partitionId, projectId) =>
  api.delete(`/admin/projects/${partitionId}/${projectId}`);

// 🔥🔥🔥 FIXED HERE
export const adminGetSystemLogs = () =>
  api.get('/admin/logs/system-logs');


/* ================= ACCOUNT ================= */
/* ================= ACCOUNT ================= */

export const deleteAccount = () =>
  api.delete('/user/delete');

/* ================= PROFILE ================= */

export const getProfile = () => api.get('/user/profile');

export const updateProfile = (data) =>
  api.put('/user/profile', data);
export default api;