import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api: AxiosInstance = axios.create({
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
  (response: AxiosResponse) => response,
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
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login: (data: Record<string, unknown>) => api.post('/auth/login', data),
  logout: (data: Record<string, unknown>) => api.post('/auth/logout', data),
};

export const projectAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/projects', { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: Record<string, unknown>) => api.post('/projects', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addMember: (id: string, userIdOrEmail: string, role: string) => api.post(`/projects/${id}/members`, { userId: userIdOrEmail, role }),
  getMembers: (id: string) => api.get(`/projects/${id}/members`),
  removeMember: (id: string, userId: string) => api.delete(`/projects/${id}/members/${userId}`),
};

export const taskAPI = {
  getByProject: (projectId: string, params?: Record<string, unknown>) => api.get('/tasks', { params: { projectId, ...params } }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: Record<string, unknown>) => api.post('/tasks', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/tasks/${id}/status`, { status }),
  assign: (id: string, assigneeId: string) => api.post(`/tasks/${id}/assign`, { assigneeId }),
};

export const githubAPI = {
  link: (projectId: string, repoUrl: string) => api.post('/github/link', { projectId, repoUrl }),
  unlink: (id: string) => api.delete(`/github/unlink/${id}`),
  sync: (id: string) => api.post(`/github/sync/${id}`),
  getCommits: (id: string) => api.get(`/github/commits/${id}`),
  getRepo: (id: string) => api.get(`/github/repo/${id}`),
};

export const commentAPI = {
  getByTask: (taskId: string) => api.get(`/tasks/${taskId}/comments`),
  create: (taskId: string, comment: string) => api.post(`/tasks/${taskId}/comments`, { comment }),
  delete: (taskId: string, commentId: string) => api.delete(`/tasks/${taskId}/comments/${commentId}`),
};

export default api;
