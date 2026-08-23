import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';

// 치수는 ProductCard와 맞춰 둔다. 실제 카드로 교체될 때 레이아웃이 튀지 않도록.
export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={150} borderRadius={0} />
      <View style={styles.body}>
        <Skeleton width="45%" height={12} />
        <Skeleton width="90%" height={16} />
        <Skeleton width="55%" height={16} />
        <View style={styles.tagRow}>
          <Skeleton width={52} height={18} borderRadius={radius.md} />
          <Skeleton width={40} height={18} borderRadius={radius.md} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hairlineLight,
    overflow: 'hidden',
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
