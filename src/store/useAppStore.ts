import { create } from 'zustand';
import type { StateStorage } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import { setApiAccessToken } from '../services/apiClient';
import type { AuthUser } from '../services/authService';

type AppState = {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  hasSeenOnboardingIntro: boolean;
  isOnboarded: boolean;
  selectedAge: string;
  preferredStyles: string[];
  login: (accessToken: string, user: AuthUser) => void;
  syncUser: (user: AuthUser, profile?: { age_range?: string | null; styles?: string[] }) => void;
  completeOnboardingIntro: () => void;
  completeOnboarding: (age: string, styles: string[], user?: AuthUser | null) => void;
  resetSession: () => void;
};

const localStateStorage: StateStorage = {
  getItem: (name) => {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(name);
    }
  },
};

const storage = createJSONStorage<AppState>(() => localStateStorage);

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      user: null,
      hasSeenOnboardingIntro: false,
      isOnboarded: false,
      selectedAge: '',
      preferredStyles: [],
      login: (accessToken, user) => {
        setApiAccessToken(accessToken);
        set({
          accessToken,
          user,
          isAuthenticated: true,
          isOnboarded: user.role !== 'guest',
          hasSeenOnboardingIntro: user.role !== 'guest',
        });
      },
      syncUser: (user, profile) => {
        setApiAccessToken(useAppStore.getState().accessToken);
        set({
          user,
          isAuthenticated: true,
          isOnboarded: user.role !== 'guest',
          hasSeenOnboardingIntro: user.role !== 'guest',
          selectedAge: profile?.age_range ?? useAppStore.getState().selectedAge,
          preferredStyles: profile?.styles ?? useAppStore.getState().preferredStyles,
        });
      },
      completeOnboardingIntro: () => set({ hasSeenOnboardingIntro: true }),
      completeOnboarding: (age, styles, user) =>
        set((state) => ({
          selectedAge: age,
          preferredStyles: styles,
          isOnboarded: true,
          hasSeenOnboardingIntro: true,
          user: user ?? (state.user ? { ...state.user, role: 'user' } : state.user),
        })),
      resetSession: () => {
        setApiAccessToken(null);
        set({
          isAuthenticated: false,
          accessToken: null,
          user: null,
          hasSeenOnboardingIntro: false,
          isOnboarded: false,
          selectedAge: '',
          preferredStyles: [],
        });
      },
    }),
    {
      name: 'aidfit-session',
      storage,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        user: state.user,
        hasSeenOnboardingIntro: state.hasSeenOnboardingIntro,
        isOnboarded: state.isOnboarded,
        selectedAge: state.selectedAge,
        preferredStyles: state.preferredStyles,
      } as AppState),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setApiAccessToken(state.accessToken);
        }
      },
    },
  ),
);
