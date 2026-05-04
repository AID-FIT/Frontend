import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type RecommendStackParamList = {
  StyleRecommend: undefined;
  RecommendationResult: {
    recommendationId: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Recommend: NavigatorScreenParams<RecommendStackParamList> | undefined;
  Closet: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  OnboardingIntro: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};
