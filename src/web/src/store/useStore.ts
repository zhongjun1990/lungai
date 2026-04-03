import { create } from 'zustand';
import { authApi, usersApi } from '../api';
import type { User } from '../api/types';

interface StoreState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string, tenantId: string) => {
    set({ isLoading: true });

    try {
      // Call login API
      await authApi.login({
        email,
        password,
        tenantId,
      });

      // Get current user info
      const user = await usersApi.getCurrentUser();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },

  setUser: (user) => {
    set({ user });
  },
}));
