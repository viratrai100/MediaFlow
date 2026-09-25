import axios from 'axios';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) || 'https://mediaflow-fdjz.onrender.com/api/v1';



export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('socialstream_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  /**
   * Fetch media info from backend
   */
  async fetchMediaInfo(url) {
    const res = await apiClient.post('/media/info', { url });
    return res.data.data;
  },

  /**
   * List supported platforms
   */
  async getPlatforms() {
    const res = await apiClient.get('/media/platforms');
    return res.data.data.platforms;
  },

  /**
   * System health check
   */
  async getHealth() {
    const res = await apiClient.get('/health');
    return res.data.data;
  },

  /**
   * Enqueue a new download job
   */
  async createJob(url, formatId) {
    const res = await apiClient.post('/jobs', { url, formatId });
    return res.data.data;
  },

  /**
   * Poll job status and progress
   */
  async getJobStatus(jobId) {
    const res = await apiClient.get(`/jobs/${jobId}`);
    return res.data.data;
  },

  /**
   * Cancel an active or queued job
   */
  async cancelJob(jobId) {
    const res = await apiClient.post(`/jobs/${jobId}/cancel`);
    return res.data.data;
  },

  /**
   * Fetch paginated job history with filters
   */
  async getJobsHistory({ page = 1, limit = 10, status = 'all', platform = 'all', search = '', type = 'all' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status !== 'all' && { status }),
      ...(platform !== 'all' && { platform }),
      ...(type !== 'all' && { type }),
      ...(search && { search })
    });
    const res = await apiClient.get(`/jobs?${params.toString()}`);
    return res.data.data;
  },

  /**
   * Delete single job history entry
   */
  async deleteJob(jobId) {
    const res = await apiClient.delete(`/jobs/${jobId}`);
    return res.data.data;
  },

  /**
   * Clear all user job history
   */
  async clearAllJobs() {
    const res = await apiClient.delete('/jobs');
    return res.data.data;
  },

  /**
   * Build direct streaming download URL
   */
  getDownloadUrl(url, formatId, title) {
    const params = new URLSearchParams({
      url,
      formatId: formatId || '1080p',
      ...(title && { title })
    });
    return `${API_BASE_URL}/media/download?${params.toString()}`;
  },

  /**
   * Get job media download URL
   */
  getJobDownloadUrl(jobId) {
    return `${API_BASE_URL}/jobs/${jobId}/download`;
  },

  // ================= AUTH APIs =================
  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data.data;
  },

  async signup(username, email, password) {
    const res = await apiClient.post('/auth/signup', { username, email, password });
    return res.data.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },

  async logout() {
    const res = await apiClient.post('/auth/logout');
    return res.data.data;
  },

  // ================= ADMIN APIs =================
  async getAdminStats() {
    const res = await apiClient.get('/admin/stats');
    return res.data.data;
  },

  async getAdminUsers({ page = 1, limit = 15, search = '', role = 'all', status = 'all' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(role !== 'all' && { role }),
      ...(status !== 'all' && { status }),
      ...(search && { search })
    });
    const res = await apiClient.get(`/admin/users?${params.toString()}`);
    return res.data.data;
  },

  async updateAdminUser(id, updates) {
    const res = await apiClient.patch(`/admin/users/${id}`, updates);
    return res.data.data;
  },

  async getAdminJobs({ page = 1, limit = 15, status = 'all', platform = 'all', search = '' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status !== 'all' && { status }),
      ...(platform !== 'all' && { platform }),
      ...(search && { search })
    });
    const res = await apiClient.get(`/admin/jobs?${params.toString()}`);
    return res.data.data;
  },

  async cancelAdminJob(id) {
    const res = await apiClient.post(`/admin/jobs/${id}/cancel`);
    return res.data.data;
  },

  async getAdminPlatforms() {
    const res = await apiClient.get('/admin/platforms');
    return res.data.data.platforms;
  },

  async updateAdminPlatform(platform, updates) {
    const res = await apiClient.patch(`/admin/platforms/${platform}`, updates);
    return res.data.data;
  },

  async getAdminAuditLogs({ page = 1, limit = 20, action = 'all', status = 'all' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(action !== 'all' && { action }),
      ...(status !== 'all' && { status })
    });
    const res = await apiClient.get(`/admin/audit-logs?${params.toString()}`);
    return res.data.data;
  },

  async getAdminSettings() {
    const res = await apiClient.get('/admin/settings');
    return res.data.data.settings;
  },

  async updateAdminSettings(settings) {
    const res = await apiClient.put('/admin/settings', settings);
    return res.data.data.settings;
  },

  async triggerAdminGC() {
    const res = await apiClient.post('/admin/maintenance/gc');
    return res.data.data;
  }
};

