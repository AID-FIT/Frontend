import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';
import type { Product } from '../../types/fashion';
import { AIRecommendBadge } from './AIRecommendBadge';
import { ExpandableReason } from './ExpandableReason';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const productUrl = product.productUrl;

  return (
    <Pressable
      accessibilityRole={productUrl ? 'link' : undefined}
      accessibilityLabel={productUrl ? `${product.name} 상품 페이지 열기` : undefined}
      disabled={!productUrl}
      onPress={() => productUrl && Linking.openURL(productUrl)}
      style={({ pressed }) => [styles.card, pressed && productUrl ? styles.pressed : null]}
    >
      <View style={[styles.image, { backgroundColor: product.imageTone }]}>
        {product.imageUrl ? (
          // 잘라서 채우면 옷의 절반만 보인다. 남는 자리는 imageTone이 메운다.
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" />
        ) : (
          <View style={styles.imageShape}>
            <Ionicons name="shirt-outline" size={38} color={colors.primary} />
          </View>
        )}
        {product.aiRecommended ? (
          <View style={styles.badge}>
            <AIRecommendBadge />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{product.price}</Text>
        {/* AI가 이 상품을 고른 이유. 없으면 자리를 차지하지 않는다. */}
        {product.reason ? (
          <ExpandableReason
            text={product.reason}
            collapsedLines={2}
            textStyle={styles.reason}
            linkSize={12}
          />
        ) : null}
        <View style={styles.tagRow}>
          {product.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
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
  pressed: {
    opacity: 0.82,
  },
  image: {
    // 의류 사진은 대개 세로형이다. 고정 높이(150)로는 상하가 잘렸다.
    aspectRatio: 3 / 4,
    justifyContent: 'center',
    overflow: 'hidden',
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
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceFilter,
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
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
  reason: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
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
