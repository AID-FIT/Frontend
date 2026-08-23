import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Google from 'expo-auth-session/providers/google';
import { AppButton } from '../../components/common/AppButton';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { env } from '../../config/env';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { loginWithGoogleIdToken } from '../../services/authService';
import { useAppStore } from '../../store/useAppStore';

export function LoginScreen() {
  const login = useAppStore((state) => state.login);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const indicator = useRef(new Animated.Value(0)).current;
  const titleText = '내 스타일을 \n가볍고 빠르게,\nAID-FIT.';
  const [typedTitle, setTypedTitle] = useState('');
  const titleIndex = useRef(0);
  const titleDirection = useRef<1 | -1>(1);
  const titlePause = useRef(0);
  const titleLines = typedTitle.split('\n');
  const titleTemplateLines = titleText.split('\n');
  const activeTitleLineIndex = titleLines.length - 1;
  const hasGoogleWebClientId = Boolean(env.google.webClientId);
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId: env.google.webClientId,
      iosClientId: env.google.iosClientId,
      androidClientId: env.google.androidClientId,
      scopes: ['openid', 'profile', 'email'],
      selectAccount: true,
    },
    {
      scheme: 'aidfit',
      path: 'auth/google',
    },
  );

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

  useEffect(() => {
    if (!googleResponse) {
      return;
    }

    if (googleResponse.type === 'dismiss' || googleResponse.type === 'cancel') {
      setIsGoogleLoading(false);
      return;
    }

    if (googleResponse.type !== 'success') {
      setAuthError('Google 로그인을 완료하지 못했어요. 다시 시도해 주세요.');
      setIsGoogleLoading(false);
      return;
    }

    const idToken = googleResponse.params.id_token;
    if (!idToken) {
      setAuthError('Google 인증 토큰을 받지 못했어요.');
      setIsGoogleLoading(false);
      return;
    }

    loginWithGoogleIdToken(idToken)
      .then((auth) => {
        login(auth.access_token, auth.user);
      })
      .catch((error: unknown) => {
        if (axios.isAxiosError(error)) {
          const detail = error.response?.data?.detail;
          const message = typeof detail === 'string' ? detail : error.message;
          setAuthError(`백엔드 로그인 연동 실패: ${message}`);
          return;
        }

        setAuthError('백엔드 로그인 연동에 실패했어요.');
      })
      .finally(() => {
        setIsGoogleLoading(false);
      });
  }, [googleResponse, login]);

  const handleGoogleLogin = () => {
    setAuthError('');

    if (!hasGoogleWebClientId) {
      setAuthError('Google Web Client ID가 설정되지 않았어요.');
      return;
    }

    setIsGoogleLoading(true);
    promptGoogleAsync().catch(() => {
      setAuthError('Google 로그인 창을 열지 못했어요.');
      setIsGoogleLoading(false);
    });
  };

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
            {titleTemplateLines.map((line, index) =>
              index === 0 ? (
                <View key={index} style={[styles.titleLineSlot, styles.titleLeftSlot]}>
                  <Text style={styles.title}>
                    {titleLines[index] ?? ''}
                    {activeTitleLineIndex === index ? <Text style={styles.cursor}>|</Text> : null}
                  </Text>
                </View>
              ) : (
                <View key={index} style={[styles.titleLineSlot, styles.titleLeftSlot]}>
                  <Text style={[styles.title, styles.titleGhost]}>{line}|</Text>
                  <Text style={[styles.title, styles.titleOverlay]}>
                    {titleLines[index] ?? ''}
                    {activeTitleLineIndex === index ? <Text style={styles.cursor}>|</Text> : null}
                  </Text>
                </View>
              ),
            )}
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
            title={isGoogleLoading ? 'Google 로그인 중' : 'Google로 시작하기'}
            variant="secondary"
            onPress={handleGoogleLogin}
            disabled={!googleRequest || isGoogleLoading}
            icon={<Text style={styles.googleIcon}>G</Text>}
          />
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
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
    minHeight: 216,
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
  titleLeftSlot: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  titleLineSlot: {
    minHeight: 54,
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
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    paddingHorizontal: spacing.md,
  },
});
