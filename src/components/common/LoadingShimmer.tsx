import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';

type LoadingShimmerProps = {
  width?: number | `${number}%`;
  height?: number;
};

export function LoadingShimmer({ width = '100%', height = 10 }: LoadingShimmerProps) {
  return (
    <View style={[styles.wrap, { width, height }]}>
      <LinearGradient
        colors={[colors.surfaceSoft, 'rgba(0,112,209,0.24)', colors.surfaceSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
  },
});
