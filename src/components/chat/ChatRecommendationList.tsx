import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';
import type { AgentRecommendationItem } from '../../services/recommendationService';
import { normalizeAssetUrl } from '../../utils/url';

type ChatRecommendationListProps = {
  items: AgentRecommendationItem[];
  tips?: string[];
};

function formatPrice(price: number | null): string {
  return price === null || price === undefined ? '가격 미정' : `${price.toLocaleString('ko-KR')}원`;
}

export function ChatRecommendationList({ items, tips = [] }: ChatRecommendationListProps) {
  if (items.length === 0 && tips.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {items.length > 0 ? (
        // 세로 목록으로 쌓으면 대화 흐름이 끊겨서 가로로 흘린다.
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {items.map((item, index) => {
            const imageUrl = normalizeAssetUrl(item.image_url);
            const productUrl = item.product_url;

            return (
              <Pressable
                key={`${item.item_id ?? item.item_name ?? 'item'}-${index}`}
                disabled={!productUrl}
                onPress={() => productUrl && Linking.openURL(productUrl)}
                style={({ pressed }) => [styles.card, pressed && productUrl ? styles.cardPressed : null]}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, styles.imageFallback]}>
                    <Ionicons name="shirt-outline" size={28} color={colors.primary} />
                  </View>
                )}

                <View style={styles.body}>
                  <Text style={styles.brand} numberOfLines={1}>
                    {item.brand ?? item.source}
                  </Text>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.item_name ?? item.category ?? '추천 아이템'}
                  </Text>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>
                  <Text style={styles.reason} numberOfLines={3}>
                    {item.reason}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {tips.length > 0 ? (
        <View style={styles.tips}>
          {tips.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Ionicons name="sparkles" size={13} color={colors.accentTeal} style={styles.tipIcon} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  carousel: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  card: {
    width: 156,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.82,
  },
  image: {
    width: '100%',
    height: 132,
    backgroundColor: colors.surfaceSoft,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.sm,
    gap: 2,
  },
  brand: {
    color: colors.subText,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  price: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  reason: {
    color: colors.subText,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  tips: {
    gap: spacing.xs,
    backgroundColor: colors.navySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});
