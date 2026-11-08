import { create } from 'zustand';
import type { AuthState } from '@/types/auth.types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setInitialized: (isInitialized) => set({ isInitialized }),
}));
