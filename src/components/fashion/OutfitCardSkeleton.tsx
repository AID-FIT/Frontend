import { StyleSheet, View } from 'react-native';
import { Skeleton, SkeletonLines } from '../common/Skeleton';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';

type OutfitCardSkeletonProps = {
  count?: number;
};

// OutfitCard와 같은 가로 배치(82x82 썸네일 + 본문 3줄).
export function OutfitCardSkeleton({ count = 3 }: OutfitCardSkeletonProps) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <Skeleton width={82} height={82} borderRadius={radius.md} />
          <View style={styles.body}>
            <Skeleton width="30%" height={14} />
            <Skeleton width="70%" height={18} />
            <SkeletonLines count={2} lastLineWidth="45%" />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
});
