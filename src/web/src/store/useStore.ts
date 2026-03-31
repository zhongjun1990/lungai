import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'radiologist' | 'technician' | 'viewer';
  tenantId: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

interface StoreState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (_email: string, _password: string) => {
    set({ isLoading: true });

    try {
      // TODO: Implement real login API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      set({
        user: {
          id: 'a1b2c3d4-5678-90ef-ghij-klmnopqrstuv',
          email: 'admin@hospital.com',
          fullName: 'System Administrator',
          role: 'admin',
          tenantId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  setUser: (user) => {
    set({ user });
  },
}));
