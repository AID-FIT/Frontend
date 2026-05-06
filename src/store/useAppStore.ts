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
  syncUser: (user: AuthUser, profile?: { age_range?: string | null; styles?: string[] }) => void;
  completeOnboardingIntro: () => void;
  completeOnboarding: (age: string, styles: string[], user?: AuthUser | null) => void;
  resetSession: () => void;
};

type PersistedSession = Pick<
  AppState,
  'isAuthenticated' | 'accessToken' | 'user' | 'hasSeenOnboardingIntro' | 'isOnboarded' | 'selectedAge' | 'preferredStyles'
>;

const SESSION_STORAGE_KEY = 'aidfit-session';

const defaultSession: PersistedSession = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
  hasSeenOnboardingIntro: false,
  isOnboarded: false,
  selectedAge: '',
  preferredStyles: [],
};

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function loadSession(): PersistedSession {
  if (!canUseLocalStorage()) {
    return defaultSession;
  }

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? { ...defaultSession, ...JSON.parse(raw) } : defaultSession;
  } catch {
    return defaultSession;
  }
}

function saveSession(session: PersistedSession) {
  if (canUseLocalStorage()) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
}

function clearSession() {
  if (canUseLocalStorage()) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

const initialSession = loadSession();
if (initialSession.accessToken) {
  setApiAccessToken(initialSession.accessToken);
}

export const useAppStore = create<AppState>((set, get) => ({
  ...initialSession,
  login: (accessToken, user) => {
    const session = {
      accessToken,
      user,
      isAuthenticated: true,
      isOnboarded: user.role !== 'guest',
      hasSeenOnboardingIntro: user.role !== 'guest',
      selectedAge: get().selectedAge,
      preferredStyles: get().preferredStyles,
    };
    setApiAccessToken(accessToken);
    saveSession(session);
    set(session);
  },
  syncUser: (user, profile) => {
    const current = get();
    const session = {
      accessToken: current.accessToken,
      user,
      isAuthenticated: true,
      isOnboarded: user.role !== 'guest',
      hasSeenOnboardingIntro: user.role !== 'guest',
      selectedAge: profile?.age_range ?? current.selectedAge,
      preferredStyles: profile?.styles ?? current.preferredStyles,
    };
    setApiAccessToken(current.accessToken);
    saveSession(session);
    set(session);
  },
  completeOnboardingIntro: () => {
    const session = { ...get(), hasSeenOnboardingIntro: true };
    saveSession(session);
    set({ hasSeenOnboardingIntro: true });
  },
  completeOnboarding: (age, styles, user) => {
    const current = get();
    const nextUser = user ?? (current.user ? { ...current.user, role: 'user' } : current.user);
    const session = {
      accessToken: current.accessToken,
      user: nextUser,
      isAuthenticated: current.isAuthenticated,
      selectedAge: age,
      preferredStyles: styles,
      isOnboarded: true,
      hasSeenOnboardingIntro: true,
    };
    saveSession(session);
    set(session);
  },
  resetSession: () => {
    setApiAccessToken(null);
    clearSession();
    set(defaultSession);
  },
}));
