import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';

// react-native-web에는 네이티브 드라이버가 없어 켜두면 경고만 남는다.
const useNativeDriver = Platform.OS !== 'web';
const DOT_COUNT = 3;

function Dot({ delay }: { delay: number }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounce, {
          toValue: 1,
          duration: 320,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 320,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver,
        }),
        // 점 3개가 한 주기를 함께 돌도록 남은 시간만큼 쉰다.
        Animated.delay((DOT_COUNT - 1) * 160 - delay),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [bounce, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: bounce.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          transform: [{ translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
        },
      ]}
    />
  );
}

export function TypingIndicator() {
  return (
    <View style={styles.row}>
      <View style={styles.bubble} accessibilityLabel="답변을 작성하는 중">
        {Array.from({ length: DOT_COUNT }).map((_, index) => (
          <Dot key={index} delay={index * 160} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  bubble: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderBottomLeftRadius: radius.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
