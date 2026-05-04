import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';
import type { Product } from '../../types/fashion';
import { AIRecommendBadge } from './AIRecommendBadge';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.image, { backgroundColor: product.imageTone }]}>
        {product.aiRecommended ? <AIRecommendBadge /> : null}
        <View style={styles.imageShape}>
          <Ionicons name="shirt-outline" size={38} color={colors.primary} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{product.price}</Text>
        <View style={styles.iconRow}>
          {product.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={styles.dot} />
          ))}
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
  image: {
    height: 150,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  imageShape: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceFilter,
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  price: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accentTeal,
  },
});
