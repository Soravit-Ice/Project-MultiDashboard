import { create } from 'zustand';
import { authAPI } from '../api/auth';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (credentials) => {
    const data = await authAPI.login(credentials);
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true });
    return data;
  },

  register: async (userData) => {
    const data = await authAPI.register(userData);
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true });
    return data;
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const data = await authAPI.getCurrentUser();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
