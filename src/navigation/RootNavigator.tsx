import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { OnboardingIntroScreen } from '../screens/onboarding/OnboardingIntroScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { getMyProfile, profileToAuthUser } from '../services/userService';
import { useAppStore } from '../store/useAppStore';
import { useLikesStore } from '../store/useLikesStore';
import type { RootStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const accessToken = useAppStore((state) => state.accessToken);
  const user = useAppStore((state) => state.user);
  const syncUser = useAppStore((state) => state.syncUser);
  const resetSession = useAppStore((state) => state.resetSession);
  const hasSeenOnboardingIntro = useAppStore((state) => state.hasSeenOnboardingIntro);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const shouldShowOnboarding = user?.role === 'guest';

  useEffect(() => {
    if (!accessToken) {
      // 로그아웃했거나 401로 세션이 끊겼다. 앞 사람의 하트가 다음 계정에
      // 남아 있으면 안 된다.
      useLikesStore.getState().clear();
      setIsBootstrapping(false);
      return;
    }

    getMyProfile()
      .then((profile) => {
        syncUser(profileToAuthUser(profile, user?.provider), {
          age_range: profile.age_range,
          styles: profile.styles,
        });
        // 하트 상태는 화면을 막지 않는다. 실패해도 스토어가 조용히 삼킨다.
        void useLikesStore.getState().hydrate();
      })
      .catch(() => {
        resetSession();
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, [accessToken, resetSession, syncUser, user?.provider]);

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.subText }}>세션을 확인하는 중이에요</Text>
      </View>
    );
  }

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
