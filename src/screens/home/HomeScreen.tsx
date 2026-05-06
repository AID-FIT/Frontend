import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from '../../components/common/AppTextInput';
import { Chip } from '../../components/common/Chip';
import { ProductCard } from '../../components/fashion/ProductCard';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { getHomeRecommendation } from '../../services/recommendationService';
import type { Product, Recommendation } from '../../types/fashion';

const categories = ['캐주얼', '여름', '미니멀', '데이트룩'];
const heroTitle = '오늘의 코디';
const titleGradient = ['#0B1F3B', '#2EC4B6'];

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function interpolateHexColor(from: string, to: string, progress: number) {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const r = Math.round(start.r + (end.r - start.r) * progress);
  const g = Math.round(start.g + (end.g - start.g) * progress);
  const b = Math.round(start.b + (end.b - start.b) * progress);
  return `rgb(${r}, ${g}, ${b})`;
}

function GradientHeroTitle() {
  const letters = Array.from(heroTitle);

  return (
    <Text style={styles.heroTitle} accessibilityLabel={heroTitle}>
      {letters.map((letter, index) => {
        const progress = letters.length <= 1 ? 0 : index / (letters.length - 1);
        return (
          <Text key={`${letter}-${index}`} style={{ color: interpolateHexColor(titleGradient[0], titleGradient[1], progress) }}>
            {letter}
          </Text>
        );
      })}
    </Text>
  );
}

export function HomeScreen() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback((nextQuery = '') => {
    setIsLoading(true);
    setError('');
    getHomeRecommendation(nextQuery)
      .then((recommendation: Recommendation) => {
        setProducts(
          recommendation.items.map((item) => ({
            id: item.product?.id ?? item.id,
            brand: item.product?.brand ?? 'AID-FIT',
            name: item.name,
            price: item.product?.price === null || item.product?.price === undefined
              ? '가격 미정'
              : `${item.product.price.toLocaleString('ko-KR')}원`,
            tags: [item.category],
            imageTone: item.imageTone,
            imageUrl: item.product?.imageUrl,
            aiRecommended: true,
          })),
        );
      })
      .catch(() => {
        setError('추천 정보를 불러오지 못했어요.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadProducts('');
  }, [loadProducts]);

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>최신 코디 정보를 가져왔어요</Text>
      </View>

      <LinearGradient colors={[colors.navySoft, colors.surfaceFilter]} style={styles.heroCard}>
        <View style={styles.heroText}>
          <GradientHeroTitle />
          <View style={styles.heroDots}>
            <View style={styles.heroDot} />
            <View style={styles.heroDotMuted} />
            <View style={styles.heroDotMuted} />
          </View>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons name="shirt-outline" size={28} color={colors.accentTeal} />
        </View>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={colors.subText} />
        <AppTextInput
          placeholder="오늘 코디에 추가로 원하는 점을 입력하세요"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => loadProducts(query)}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.chips}>
        {categories.map((category, index) => (
          <Chip key={category} label={category} selected={index === 0} />
        ))}
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.stateText}>
            {isLoading ? '상품 정보를 불러오는 중이에요.' : error || '표시할 상품이 없어요.'}
          </Text>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: 0,
  },
  greeting: {
    color: colors.text,
    fontSize: typography.heading,
    lineHeight: 44,
    letterSpacing: letterSpacing.heading,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  heroCard: {
    minHeight: 124,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairlineLight,
  },
  heroText: {
    flex: 1,
    gap: spacing.sm,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: letterSpacing.heading,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  heroDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroDot: {
    width: 28,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTeal,
  },
  heroDotMuted: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.ashLight,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingLeft: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  grid: {
    paddingBottom: 112,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stateText: {
    color: colors.subText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});
