import { create } from 'zustand';
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
  completeOnboardingIntro: () => void;
  completeOnboarding: (age: string, styles: string[], user?: AuthUser | null) => void;
  resetSession: () => void;
};

export const useAppStore = create<AppState>((set) => ({
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
}));
