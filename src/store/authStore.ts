import { create } from 'zustand';
import { User } from '../types';
import { AuthService } from '../services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const user = await AuthService.signIn(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await AuthService.signOut();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      throw error;
    }
  },

  initializeAuth: () => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      set({ user, isAuthenticated: !!user, isLoading: false });
    });

    // Return unsubscribe function for cleanup
    return unsubscribe;
  }
}));