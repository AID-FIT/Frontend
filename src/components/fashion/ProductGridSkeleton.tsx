import { StyleSheet, View } from 'react-native';
import { spacing } from '../../constants/spacing';
import { ProductCardSkeleton } from './ProductCardSkeleton';

type ProductGridSkeletonProps = {
  count?: number;
};

// HomeScreen의 2열 FlatList와 같은 간격으로 배치해, 로딩이 끝나도 자리가 밀리지 않게 한다.
export function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps) {
  const rows = Array.from({ length: Math.ceil(count / 2) });

  return (
    <View>
      {rows.map((_, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          <ProductCardSkeleton />
          {rowIndex * 2 + 1 < count ? <ProductCardSkeleton /> : <View style={styles.spacer} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  spacer: {
    flex: 1,
    minWidth: 0,
  },
});
