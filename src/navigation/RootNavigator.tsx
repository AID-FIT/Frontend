import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { OnboardingIntroScreen } from '../screens/onboarding/OnboardingIntroScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { useAppStore } from '../store/useAppStore';
import type { RootStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const user = useAppStore((state) => state.user);
  const hasSeenOnboardingIntro = useAppStore((state) => state.hasSeenOnboardingIntro);
  const shouldShowOnboarding = user?.role === 'guest';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : shouldShowOnboarding && !hasSeenOnboardingIntro ? (
        <Stack.Screen name="OnboardingIntro" component={OnboardingIntroScreen} />
      ) : shouldShowOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}
