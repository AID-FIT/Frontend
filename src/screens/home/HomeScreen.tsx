import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, FlatList, PanResponder, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
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
const endReachedMessage = '모든 추천 아이템을 보았어요! 아래로 당겨 새롭게 아이템을 추천해드릴게요!';

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
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshingRecommendations, setIsRefreshingRecommendations] = useState(false);
  const [error, setError] = useState('');
  const [hasReachedEndOnce, setHasReachedEndOnce] = useState(false);
  const requestKeyRef = useRef(0);
  const refreshSeedRef = useRef(0);
  const listRef = useRef<FlatList<Product>>(null);
  const scrollOffsetRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const canTriggerEndRefreshRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        dragStartOffsetRef.current = scrollOffsetRef.current;
        canTriggerEndRefreshRef.current = true;
      },
      onPanResponderMove: (_, gestureState) => {
        const nextOffset = Math.max(0, dragStartOffsetRef.current - gestureState.dy);
        listRef.current?.scrollToOffset({ offset: nextOffset, animated: false });
      },
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  const recommendationToProducts = useCallback((recommendation: Recommendation, refreshSeed: number): Product[] => (
    recommendation.items.map((item, index) => ({
      id: `${item.product?.id ?? item.id}-${refreshSeed}-${index}`,
      brand: item.product?.brand ?? 'AID-FIT',
      name: item.name,
      price: item.product?.price === null || item.product?.price === undefined
        ? '가격 미정'
        : `${item.product.price.toLocaleString('ko-KR')}원`,
      tags: [item.category],
      imageTone: item.imageTone,
      imageUrl: item.product?.imageUrl,
      aiRecommended: true,
    }))
  ), []);

  const loadProducts = useCallback((nextQuery = '', refreshSeed = 0, showInitialLoader = true) => {
    const requestKey = requestKeyRef.current + 1;
    requestKeyRef.current = requestKey;

    if (showInitialLoader) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshingRecommendations(true);
    }
    setHasReachedEndOnce(false);
    setError('');
    getHomeRecommendation(nextQuery.trim(), refreshSeed)
      .then((recommendation: Recommendation) => {
        if (requestKeyRef.current !== requestKey) {
          return;
        }

        const nextProducts = recommendationToProducts(recommendation, refreshSeed);
        setProducts(nextProducts);
        refreshSeedRef.current = refreshSeed;
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      })
      .catch(() => {
        setError('추천 정보를 불러오지 못했어요.');
      })
      .finally(() => {
        if (requestKeyRef.current !== requestKey) {
          return;
        }

        setIsInitialLoading(false);
        setIsRefreshingRecommendations(false);
      });
  }, [recommendationToProducts]);

  const handleEndReached = useCallback(() => {
    if (
      isInitialLoading ||
      isRefreshingRecommendations ||
      products.length === 0 ||
      !canTriggerEndRefreshRef.current
    ) {
      return;
    }

    canTriggerEndRefreshRef.current = false;
    if (!hasReachedEndOnce) {
      setHasReachedEndOnce(true);
      return;
    }

    loadProducts(query, refreshSeedRef.current + 1, false);
  }, [hasReachedEndOnce, isInitialLoading, isRefreshingRecommendations, loadProducts, products.length, query]);

  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(category);
    setQuery(category);
    loadProducts(category, 0, true);
  }, [loadProducts]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    scrollOffsetRef.current = contentOffset.y;

    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom <= 24) {
      handleEndReached();
    }
  }, [handleEndReached]);

  useEffect(() => {
    loadProducts('', 0, true);
  }, [loadProducts]);

  const header = (
    <>
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
          onSubmitEditing={() => loadProducts(query, 0, true)}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.chips}>
        {categories.map((category) => (
          <Chip
            key={category}
            label={category}
            selected={selectedCategory === category}
            onPress={() => handleCategoryPress(category)}
          />
        ))}
      </View>
    </>
  );

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.feed} {...panResponder.panHandlers}>
        <FlatList
          ref={listRef}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          ListHeaderComponent={header}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollBeginDrag={() => {
            canTriggerEndRefreshRef.current = true;
          }}
          scrollEventThrottle={16}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.42}
          bounces
          alwaysBounceVertical
          style={styles.feedList}
          ListEmptyComponent={
            <Text style={styles.stateText}>
              {isInitialLoading ? '추천 정보를 불러오는 중이에요.' : error || '표시할 추천이 없어요.'}
            </Text>
          }
          ListFooterComponent={
            products.length > 0 ? (
              <View style={styles.footer}>
                {isRefreshingRecommendations ? (
                  <>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.footerText}>새 추천을 불러오는 중이에요</Text>
                  </>
                ) : (
                  <Text style={styles.footerText}>{endReachedMessage}</Text>
                )}
              </View>
            ) : null
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      </View>
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
  feed: {
    flex: 1,
    minHeight: 0,
  },
  feedList: {
    flex: 1,
  },
  grid: {
    paddingBottom: 124,
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
  footer: {
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  footerText: {
    color: colors.subText,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});
