import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
};

// react-native-web에는 네이티브 드라이버가 없어 켜두면 경고만 남는다.
const useNativeDriver = Platform.OS !== 'web';

// 대기 시간이 살아 있게 느껴지도록 불투명도를 왕복시킨다.
export function Skeleton({ width = '100%', height = 12, borderRadius = radius.sm, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { width, height, borderRadius, opacity }, style]}
    />
  );
}

// 여러 줄짜리 텍스트 자리. 마지막 줄만 짧게 잘라 실제 문단처럼 보이게 한다.
export function SkeletonLines({ count = 2, lastLineWidth = '60%' }: { count?: number; lastLineWidth?: DimensionValue }) {
  return (
    <View style={styles.lines}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} width={index === count - 1 ? lastLineWidth : '100%'} height={12} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceSoft,
  },
  lines: {
    gap: 8,
  },
});
