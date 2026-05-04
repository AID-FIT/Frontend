import { create } from 'zustand';

type AppState = {
  isAuthenticated: boolean;
  hasSeenOnboardingIntro: boolean;
  isOnboarded: boolean;
  selectedAge: string;
  preferredStyles: string[];
  login: () => void;
  completeOnboardingIntro: () => void;
  completeOnboarding: (age: string, styles: string[]) => void;
  resetSession: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  hasSeenOnboardingIntro: false,
  isOnboarded: false,
  selectedAge: '',
  preferredStyles: [],
  login: () => set({ isAuthenticated: true }),
  completeOnboardingIntro: () => set({ hasSeenOnboardingIntro: true }),
  completeOnboarding: (age, styles) =>
    set({
      selectedAge: age,
      preferredStyles: styles,
      isOnboarded: true,
    }),
  resetSession: () =>
    set({
      isAuthenticated: false,
      hasSeenOnboardingIntro: false,
      isOnboarded: false,
      selectedAge: '',
      preferredStyles: [],
    }),
}));
