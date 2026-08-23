import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';

type ClosetGridSkeletonProps = {
  count?: number;
};

// ClosetScreen 그리드 아이템(47.8% 폭, 116 높이 썸네일)과 같은 치수.
export function ClosetGridSkeleton({ count = 4 }: ClosetGridSkeletonProps) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.item}>
          <Skeleton width="100%" height={116} borderRadius={radius.md} />
          <Skeleton width="60%" height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  item: {
    width: '47.8%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
