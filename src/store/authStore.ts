// User auth state (token, user object)

import { create } from 'zustand';
import { clearSession } from '@/services/tokenStorage';

export interface User {
  _id?: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  role?: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setHydrated: (value) => set({ isHydrated: value }),
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    void clearSession();
  },
}));
