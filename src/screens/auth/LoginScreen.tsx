import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { useAppStore } from '../../store/useAppStore';

export function LoginScreen() {
  const login = useAppStore((state) => state.login);
  const indicator = useRef(new Animated.Value(0)).current;
  const titleText = '내 스타일을 가볍고\n빠르게 완성해요';
  const [typedTitle, setTypedTitle] = useState('');
  const titleIndex = useRef(0);
  const titleDirection = useRef<1 | -1>(1);
  const titlePause = useRef(0);
  const [firstTitleLine = '', secondTitleLine = ''] = typedTitle.split('\n');
  const isSecondLineActive = typedTitle.includes('\n');

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(indicator, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(indicator, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(680),
        Animated.timing(indicator, {
          toValue: 2,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(680),
        Animated.timing(indicator, {
          toValue: 3,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(680),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [indicator]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (titlePause.current > 0) {
        titlePause.current -= 1;
        return;
      }

      const nextIndex = titleIndex.current + titleDirection.current;
      titleIndex.current = nextIndex;
      setTypedTitle(titleText.slice(0, nextIndex));

      if (nextIndex === titleText.length) {
        titleDirection.current = -1;
        titlePause.current = 10;
      }

      if (nextIndex === 0) {
        titleDirection.current = 1;
        titlePause.current = 4;
      }
    }, 82);

    return () => clearInterval(timer);
  }, [titleText]);

  const activeIconStyle = (index: number) => {
    const translateOutput =
      index === 0 ? [-9, 0, 0, -9] : index === 1 ? [0, -9, 0, 0] : [0, 0, -9, 0];
    const opacityOutput =
      index === 0 ? [1, 0.78, 0.78, 1] : index === 1 ? [0.78, 1, 0.78, 0.78] : [0.78, 0.78, 1, 0.78];

    return {
      transform: [
        {
          translateY: indicator.interpolate({
            inputRange: [0, 1, 2, 3],
            outputRange: translateOutput,
            extrapolate: 'clamp',
          }),
        },
      ],
      opacity: indicator.interpolate({
        inputRange: [0, 1, 2, 3],
        outputRange: opacityOutput,
        extrapolate: 'clamp',
      }),
    };
  };

  const indicatorTranslateX = indicator.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, 68, 136, 0],
  });

  return (
    <ScreenContainer scroll={false} padded={false}>
      <View style={styles.wrap}>
        <View style={styles.hero}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>
              {firstTitleLine}
              {!isSecondLineActive ? <Text style={styles.cursor}>|</Text> : null}
            </Text>
            <View style={styles.titleRightSlot}>
              <Text style={[styles.title, styles.titleGhost]}>빠르게 완성해요|</Text>
              <Text style={[styles.title, styles.titleOverlay]}>
                {secondTitleLine}
                {isSecondLineActive ? <Text style={styles.cursor}>|</Text> : null}
              </Text>
            </View>
          </View>
          <View style={styles.motionArea}>
            <View style={styles.iconRow}>
              <Animated.View style={[styles.iconBadge, activeIconStyle(0)]}>
                <Ionicons name="shirt-outline" size={24} color={colors.primary} />
              </Animated.View>
              <Animated.View style={[styles.iconBadge, activeIconStyle(1)]}>
                <Ionicons name="sparkles" size={23} color={colors.accentTeal} />
              </Animated.View>
              <Animated.View style={[styles.iconBadge, activeIconStyle(2)]}>
                <Ionicons name="heart-outline" size={24} color={colors.primary} />
              </Animated.View>
            </View>
            <View style={styles.indicatorWrap}>
              <Animated.View
                style={[
                  styles.indicatorBar,
                  {
                    transform: [{ translateX: indicatorTranslateX }],
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.buttons}>
          <AppButton
            title="Google로 시작하기"
            variant="secondary"
            onPress={login}
            icon={<Text style={styles.googleIcon}>G</Text>}
          />
          <AppButton
            title="Apple로 시작하기"
            variant="dark"
            onPress={login}
            icon={<Ionicons name="logo-apple" size={20} color={colors.white} />}
          />
          <Text style={styles.terms}>로그인하면 약관에 동의한 것으로 간주됩니다.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: 72,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'stretch',
    paddingTop: spacing.md,
  },
  titleWrap: {
    minHeight: 114,
  },
  title: {
    color: colors.text,
    fontSize: 42,
    lineHeight: 54,
    letterSpacing: letterSpacing.heading,
    textAlign: 'left',
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  titleRightSlot: {
    alignSelf: 'flex-end',
    position: 'relative',
  },
  titleGhost: {
    opacity: 0,
  },
  titleOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  cursor: {
    color: colors.primary,
  },
  motionArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 56,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: spacing.xl,
    height: 64,
    alignItems: 'flex-end',
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  indicatorWrap: {
    width: 190,
    height: 8,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    backgroundColor: colors.muted,
    overflow: 'hidden',
  },
  indicatorBar: {
    width: 54,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTeal,
  },
  buttons: {
    gap: spacing.md,
  },
  googleIcon: {
    color: colors.secondaryBlue,
    fontSize: 18,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  terms: {
    color: colors.subText,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    paddingHorizontal: spacing.md,
  },
});
