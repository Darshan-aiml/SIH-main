import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ev_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ev_token');
      localStorage.removeItem('ev_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// --- Auth API ---
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  getMe: () => api.get('/api/auth/me'),
};

// --- Cases API ---
export const caseApi = {
  list: (params?: Record<string, string>) =>
    api.get('/api/cases', { params }),
  get: (id: number) => api.get(`/api/cases/${id}`),
  getEvidence: (id: number) => api.get(`/api/cases/${id}/evidence`),
  create: (data: Record<string, string>) =>
    api.post('/api/cases', data),
  update: (id: number, data: Record<string, string>) =>
    api.put(`/api/cases/${id}`, data),
};

// --- Evidence API ---
export const evidenceApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/api/evidence', { params }),
  get: (id: number) => api.get(`/api/evidence/${id}`),
  upload: (formData: FormData) =>
    api.post('/api/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getPassport: (id: number) => api.get(`/api/evidence/${id}/passport`),
  verify: (id: number) => api.post(`/api/evidence/${id}/verify`),
  transfer: (id: number, data: { recipient_user_id?: number; target_user_id?: number; location?: string; condition?: string; notes?: string }) =>
    api.post(`/api/evidence/${id}/transfer`, data),
  getVersions: (id: number) => api.get(`/api/evidence/${id}/versions`),
  createVersion: (id: number, formData: FormData) =>
    api.post(`/api/evidence/${id}/versions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getCustody: (id: number) => api.get(`/api/evidence/${id}/custody`),
  getCaseEvidence: (caseId: number) => api.get(`/api/cases/${caseId}/evidence`),
  getGraph: (id: number) => api.get(`/api/evidence/${id}/graph`),
  download: (id: number) =>
    api.get(`/api/evidence/${id}/download`, { responseType: 'blob' }),
};


// --- AI API ---
export const aiApi = {
  analyze: (evidenceId: number) =>
    api.post(`/api/ai/analyze/${evidenceId}`),
  getResults: (evidenceId: number) =>
    api.get(`/api/ai/results/${evidenceId}`),
};

// --- Blockchain API ---
export const blockchainApi = {
  listBlocks: (params?: Record<string, number>) =>
    api.get('/api/blockchain/blocks', { params }),
  getEvidenceBlocks: (evidenceId: string) =>
    api.get(`/api/blockchain/evidence/${evidenceId}`),
  verifyChain: () => api.post('/api/blockchain/verify'),
  verifyEvidence: (evidenceId: string) =>
    api.post(`/api/blockchain/verify/${evidenceId}`),
};

// --- Audit API ---
export const auditApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/api/audit-logs', { params }),
};

// --- Users API ---
export const userApi = {
  list: () => api.get('/api/users'),
  create: (data: Record<string, string>) =>
    api.post('/api/users', data),
};

// --- Dashboard API ---
export const dashboardApi = {
  getStats: () => api.get('/api/dashboard'),
  search: (q: string) => api.get('/api/search', { params: { q } }),
  simulateTamper: (evidenceId: number) =>
    api.post(`/api/demo/simulate-tamper?evidence_id=${evidenceId}`),
};

// --- Reports API ---
export const reportApi = {
  generateEvidence: (evidenceId: number) =>
    api.get(`/api/reports/evidence/${evidenceId}`, { responseType: 'blob' }),
};

// --- Health API ---
export const healthApi = {
  check: () => api.get('/api/health'),
};

export default api;
