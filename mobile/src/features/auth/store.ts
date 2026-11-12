import { create } from 'zustand';

import {
  clearAuthToken,
  loadAuthToken,
  saveAuthToken,
} from '../../lib/secureStorage';
import { queryClient } from '../../lib/queryClient';
import type { AuthPayload, User } from '../../types/auth';
import { fetchMeRequest } from './api';

interface AuthState {
  token: string | null;
  user: User | null;
  isHydrating: boolean;
  isServerWaking: boolean;
  setServerWaking: (waking: boolean) => void;
  setSession: (payload: AuthPayload) => Promise<void>;
  setUser: (user: User) => void;
  hydrateSession: () => Promise<void>;
  logout: () => Promise<void>;
  resetSessionSync: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrating: true,
  isServerWaking: false,

  setServerWaking: (waking) => {
    set({ isServerWaking: waking });
  },

  setSession: async (payload) => {
    await saveAuthToken(payload.token);
    set({
      token: payload.token,
      user: payload.user,
      isHydrating: false,
    });
  },

  setUser: (user) => {
    set({ user });
  },

  hydrateSession: async () => {
    set({ isHydrating: true });
    const storedToken = await loadAuthToken();
    if (!storedToken) {
      set({ token: null, user: null, isHydrating: false });
      return;
    }

    set({ token: storedToken, isHydrating: false });

    // Refresh user profile in background; 401 triggers interceptor reset.
    try {
      const user = await fetchMeRequest();
      set({ user });
    } catch {
      // Network/cold-start errors keep the stored session intact; 401 is handled globally.
    }
  },

  logout: async () => {
    await clearAuthToken();
    queryClient.clear();
    set({ token: null, user: null, isHydrating: false });
  },

  resetSessionSync: () => {
    clearAuthToken().catch(() => {});
    queryClient.clear();
    set({ token: null, user: null, isHydrating: false });
  },
}));
