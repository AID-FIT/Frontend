import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
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
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={styles.imageShape}>
            <Ionicons name="shirt-outline" size={38} color={colors.primary} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{product.price}</Text>
        <View style={styles.tagRow}>
          {product.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>{tag}</Text>
            </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceFilter,
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  brand: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
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
  tagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tag: {
    maxWidth: '48%',
    borderRadius: radius.md,
    backgroundColor: colors.navySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    color: colors.primary,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
  },
});
