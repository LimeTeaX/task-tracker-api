import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
};

export const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, userIdOrEmail, role) => api.post(`/projects/${id}/members`, { userId: userIdOrEmail, role }),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

export const taskAPI = {
  getByProject: (projectId, params) => api.get('/tasks', { params: { projectId, ...params } }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  assign: (id, assigneeId) => api.post(`/tasks/${id}/assign`, { assigneeId }),
};

export const githubAPI = {
  link: (projectId, repoUrl) => api.post('/github/link', { projectId, repoUrl }),
  unlink: (id) => api.delete(`/github/unlink/${id}`),
  sync: (id) => api.post(`/github/sync/${id}`),
  getCommits: (id) => api.get(`/github/commits/${id}`),
  getRepo: (id) => api.get(`/github/repo/${id}`),
};

export const commentAPI = {
  getByTask: (taskId) => api.get(`/task/${taskId}/comments`),
  create: (taskId, comment) => api.post(`/task/${taskId}/comments`, { comment }),
  delete: (id) => api.delete(`/comments/${id}`),
};

export default api;
