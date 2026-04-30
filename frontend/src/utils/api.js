import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params });
export const createExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// Dashboard
export const getDashboardSummary = (params) => api.get('/dashboard/summary', { params });
export const getCategoryBreakdown = (params) => api.get('/dashboard/category-breakdown', { params });
export const getMonthlyTrend = (params) => api.get('/dashboard/monthly-trend', { params });
export const getRecentExpenses = () => api.get('/dashboard/recent');

// Budget
export const getBudgets = (params) => api.get('/budget', { params });
export const createBudget = (data) => api.post('/budget', data);
export const deleteBudget = (id) => api.delete(`/budget/${id}`);

// Categories
export const getCategories = () => api.get('/categories');

export default api;
