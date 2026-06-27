import { create } from 'zustand';
import { setApiAccessToken, setUnauthorizedHandler } from '../services/apiClient';
import type { AuthUser } from '../services/authService';
import {
  clearSession,
  defaultSession,
  loadSession,
  saveSession,
  type PersistedSession,
} from '../services/sessionStorage';

type AppState = PersistedSession & {
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (accessToken: string, user: AuthUser) => void;
  syncUser: (user: AuthUser, profile?: { age_range?: string | null; styles?: string[] }) => void;
  completeOnboardingIntro: () => void;
  completeOnboarding: (age: string, styles: string[], user?: AuthUser | null) => void;
  resetSession: () => void;
};

function pickSession(state: AppState): PersistedSession {
  return {
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
    user: state.user,
    hasSeenOnboardingIntro: state.hasSeenOnboardingIntro,
    isOnboarded: state.isOnboarded,
    selectedAge: state.selectedAge,
    preferredStyles: state.preferredStyles,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  ...defaultSession,
  hasHydrated: false,
  hydrate: async () => {
    const session = await loadSession();
    setApiAccessToken(session.accessToken);
    set({ ...session, hasHydrated: true });
  },
  login: (accessToken, user) => {
    const session: PersistedSession = {
      accessToken,
      user,
      isAuthenticated: true,
      isOnboarded: user.role !== 'guest',
      hasSeenOnboardingIntro: user.role !== 'guest',
      selectedAge: get().selectedAge,
      preferredStyles: get().preferredStyles,
    };
    setApiAccessToken(accessToken);
    void saveSession(session);
    set(session);
  },
  syncUser: (user, profile) => {
    const current = get();
    const session: PersistedSession = {
      accessToken: current.accessToken,
      user,
      isAuthenticated: true,
      isOnboarded: user.role !== 'guest',
      hasSeenOnboardingIntro: user.role !== 'guest',
      selectedAge: profile?.age_range ?? current.selectedAge,
      preferredStyles: profile?.styles ?? current.preferredStyles,
    };
    setApiAccessToken(current.accessToken);
    void saveSession(session);
    set(session);
  },
  completeOnboardingIntro: () => {
    set({ hasSeenOnboardingIntro: true });
    void saveSession(pickSession(get()));
  },
  completeOnboarding: (age, styles, user) => {
    const current = get();
    const nextUser = user ?? (current.user ? { ...current.user, role: 'user' } : current.user);
    const session: PersistedSession = {
      accessToken: current.accessToken,
      user: nextUser,
      isAuthenticated: current.isAuthenticated,
      selectedAge: age,
      preferredStyles: styles,
      isOnboarded: true,
      hasSeenOnboardingIntro: true,
    };
    void saveSession(session);
    set(session);
  },
  resetSession: () => {
    setApiAccessToken(null);
    void clearSession();
    set({ ...defaultSession });
  },
}));

// 401 응답 시 스토어 세션을 정리한다(apiClient → store 순환 참조 방지).
setUnauthorizedHandler(() => {
  useAppStore.getState().resetSession();
});
