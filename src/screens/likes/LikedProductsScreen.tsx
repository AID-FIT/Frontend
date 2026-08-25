import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../components/common/AppCard';
import { ProductCard } from '../../components/fashion/ProductCard';
import { ProductGridSkeleton } from '../../components/fashion/ProductGridSkeleton';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { listLikes, type ProductLike } from '../../services/likeService';
import type { Product } from '../../types/fashion';

/**
 * 저장해 둔 좋아요를 홈과 같은 상품 카드로 되살린다.
 *
 * `itemId`에 `product_ref`를 그대로 넣는 것이 핵심이다. 하트가 키를 고를 때
 * `item_id`를 가장 먼저 보므로, 원래 어떤 필드로 키가 만들어졌든 목록의 하트가
 * 서버에 저장된 것과 같은 값을 가리킨다.
 */
function likeToProduct(like: ProductLike): Product {
  return {
    id: like.id,
    itemId: like.product_ref,
    source: like.source,
    brand: like.brand ?? '브랜드 미상',
    name: like.name ?? '이름 없는 상품',
    category: like.category ?? '기타',
    price: like.price === null ? '가격 미정' : `${like.price.toLocaleString('ko-KR')}원`,
    priceValue: like.price,
    tags: like.category ? [like.category] : [],
    imageTone: colors.surface,
    imageUrl: like.image_url,
    productUrl: like.product_url,
  };
}

export function LikedProductsScreen() {
  const [likes, setLikes] = useState<ProductLike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 다른 탭에서 하트를 누르고 돌아올 수 있으므로 진입할 때마다 다시 읽는다.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setError('');

      listLikes()
        .then((next) => {
          if (!cancelled) {
            setLikes(next);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError('찜한 상품을 불러오지 못했어요.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  // 하트를 끈 상품도 이번 화면에서는 그대로 둔다. 잘못 눌렀을 때 되돌릴 자리가
  // 남아야 하고, 다음에 들어오면 어차피 사라진다.
  const products = likes.map(likeToProduct);
  const rows = Array.from({ length: Math.ceil(products.length / 2) });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>찜한 상품</Text>
      </View>

      {error && products.length > 0 ? <Text style={styles.errorText}>{error}</Text> : null}

      {isLoading ? (
        <ProductGridSkeleton />
      ) : products.length > 0 ? (
        <View>
          {rows.map((_, rowIndex) => (
            <View key={products[rowIndex * 2].id} style={styles.row}>
              <ProductCard product={products[rowIndex * 2]} />
              {/* 홀수로 끝나면 남은 칸을 비워 둔다. 없으면 마지막 카드가 두 배로 늘어난다. */}
              {products[rowIndex * 2 + 1] ? (
                <ProductCard product={products[rowIndex * 2 + 1]} />
              ) : (
                <View style={styles.spacer} />
              )}
            </View>
          ))}
        </View>
      ) : (
        <AppCard style={styles.empty}>
          <Ionicons name="heart-outline" size={42} color={colors.accentTeal} />
          <Text style={styles.emptyTitle}>{error || '아직 찜한 상품이 없어요'}</Text>
          <Text style={styles.emptyText}>
            마음에 드는 상품의 하트를 누르면 여기에 모아 둘게요.
          </Text>
        </AppCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    lineHeight: 44,
    letterSpacing: letterSpacing.heading,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  spacer: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.huge,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  emptyText: {
    color: colors.subText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});
