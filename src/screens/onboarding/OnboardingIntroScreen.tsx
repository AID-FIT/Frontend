import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { fontFamily, fontWeight, letterSpacing } from '../../constants/typography';
import { useAppStore } from '../../store/useAppStore';

export function OnboardingIntroScreen() {
  const completeOnboardingIntro = useAppStore((state) => state.completeOnboardingIntro);

  useEffect(() => {
    const timer = setTimeout(completeOnboardingIntro, 2000);
    return () => clearTimeout(timer);
  }, [completeOnboardingIntro]);

  return (
    <ScreenContainer scroll={false} padded={false}>
      <View style={styles.wrap}>
        <Text style={styles.title}>이제 사용자님에 대해{'\n'}알아볼게요</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 32,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 38,
    letterSpacing: letterSpacing.heading,
    textAlign: 'center',
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
});
