import axios from 'axios';
import toast from 'react-hot-toast';
import API_CONFIG from '../config/api';

// URL da API - prioriza variável de ambiente, senão usa Railway
const API_BASE_URL = process.env.REACT_APP_API_URL || API_CONFIG.BASE_URL;

console.log('API URL:', API_BASE_URL); // Debug

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('Erro na resposta:', error);
    
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Repetir a requisição original com o novo token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Erro no refresh token:', refreshError);
        // Se o refresh falhar, fazer logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    // Tratamento de erros específicos
    if (error.code === 'ECONNABORTED') {
      toast.error('Timeout na conexão com o servidor. Tente novamente.');
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
    } else if (error.response?.status === 500) {
      toast.error('Erro interno do servidor. Tente novamente mais tarde.');
    } else if (error.response?.status === 404) {
      toast.error('Recurso não encontrado.');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Erro na comunicação com o servidor. Tente novamente.');
    }

    return Promise.reject(error);
  }
);

// Função para testar a conectividade com o servidor
export const testConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    console.log('Conexão com servidor OK:', response.data);
    return true;
  } catch (error) {
    console.error('Erro na conexão com servidor:', error);
    return false;
  }
};

// Serviços de autenticação
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Serviços de usuário
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getDashboard: () => api.get('/users/dashboard'),
  getStats: () => api.get('/users/stats'),
  changePassword: (data) => api.put('/users/change-password', data),
};

// Serviços de cronograma
export const scheduleService = {
  getAll: () => api.get('/schedule'),
  getById: (id) => api.get(`/schedule/${id}`),
  create: (data) => api.post('/schedule', data),
  update: (id, data) => api.put(`/schedule/${id}`, data),
  delete: (id) => api.delete(`/schedule/${id}`),
  generateAI: (data) => api.post('/schedule/generate-ai', data),
  getToday: () => api.get('/schedule/today'),
  markCompleted: (id) => api.put(`/schedule/${id}/complete`),
};

// Serviços de matérias
export const subjectsService = {
  getAll: () => api.get('/subjects'),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  getStats: (id) => api.get(`/subjects/${id}/stats`),
  reorderPriorities: (data) => api.put('/subjects/reorder-priorities', data),
};

// Serviços de flashcards
export const flashcardsService = {
  getAll: () => api.get('/flashcards'),
  getById: (id) => api.get(`/flashcards/${id}`),
  create: (data) => api.post('/flashcards', data),
  update: (id, data) => api.put(`/flashcards/${id}`, data),
  delete: (id) => api.delete(`/flashcards/${id}`),
  review: (id, difficulty) => api.put(`/flashcards/${id}/review`, { difficulty }),
  getDue: () => api.get('/flashcards/due'),
  import: (data) => api.post('/flashcards/import', data),
  getStats: () => api.get('/flashcards/stats'),
};

// Serviços de gamificação
export const gamificationService = {
  getProfile: () => api.get('/gamification/profile'),
  getAchievements: () => api.get('/gamification/achievements'),
  getRanking: () => api.get('/gamification/ranking'),
  getHistory: () => api.get('/gamification/history'),
  checkAchievements: () => api.post('/gamification/check-achievements'),
};

// Serviços de notificações
export const notificationsService = {
  getAll: () => api.get('/notifications'),
  getById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (data) => api.put('/notifications/settings', data),
  sendTest: () => api.post('/notifications/send-test'),
};

// Serviços administrativos
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStudents: (params) => api.get('/admin/students', { params }),
  getStudentProfile: (id) => api.get(`/admin/students/${id}`),
  getScheduleTemplates: () => api.get('/admin/schedule-templates'),
  createScheduleTemplate: (data) => api.post('/admin/schedule-templates', data),
  getChallenges: () => api.get('/admin/challenges'),
  createChallenge: (data) => api.post('/admin/challenges', data),
  getReports: (params) => api.get('/admin/reports', { params }),
  sendBulkNotification: (data) => api.post('/admin/notifications/bulk', data),
  getPlatformStats: () => api.get('/admin/stats'),
};

export default api; 