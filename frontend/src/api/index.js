// src/api/index.js
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// Projects
export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const deployProject = (data) => api.post('/projects', data);
export const redeployProject = (id) => api.post(`/projects/${id}/redeploy`);
export const stopProject = (id) => api.post(`/projects/${id}/stop`);
export const restartProject = (id) => api.post(`/projects/${id}/restart`);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// Logs
export const getBuildLogs = (id) => api.get(`/projects/${id}/logs/build`);
export const getRuntimeLogs = (id) => api.get(`/projects/${id}/logs/runtime`);

// Admin
export const adminGetUsers = () => api.get('/admin/users');
export const adminGetProjects = () => api.get('/admin/projects');
export const adminBlockUser = (userId) => api.post(`/admin/users/${userId}/block`);
export const adminDeleteUser = (userId) => api.delete(`/admin/users/${userId}`);
export const adminStopProject = (id) => api.post(`/admin/projects/${id}/stop`);
export const adminDeleteProject = (id) => api.delete(`/admin/projects/${id}`);
export const adminGetSystemLogs = () => api.get('/admin/logs');

// Profile
export const getProfile = () => api.get('/user/profile');
export const updateProfile = (data) => api.put('/user/profile', data);

export default api;
