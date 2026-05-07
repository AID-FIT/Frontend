import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AppTextInput } from '../../components/common/AppTextInput';
import { Chip } from '../../components/common/Chip';
import { ProductCard } from '../../components/fashion/ProductCard';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { getHomeRecommendation } from '../../services/recommendationService';
import type { OutfitItem, Product, Recommendation } from '../../types/fashion';

const categories = ['캐주얼', '여름', '미니멀', '데이트룩'];
const heroTitle = '오늘의 코디';
const titleGradient = ['#0B1F3B', '#2EC4B6'];
const endReachedMessage = '모든 추천 아이템을 보았어요! 아래로 당겨 새롭게 아이템을 추천해드릴게요!';
const edgeThreshold = 24;
const bottomPullThreshold = 36;
const refreshLimitPerSession = 5;
const refreshCooldownMs = 5 * 60 * 1000;
const outfitSetPreviewCount = 3;
const outfitCategoryOrder = ['cap', 'hat', 'top', 'shirt', 'outer', 'pants', 'bottom', 'shoes', 'bag', 'accessory'];
const outfitCategoryLabels: Record<string, string> = {
  cap: '모자',
  hat: '모자',
  top: '상의',
  shirt: '상의',
  outer: '아우터',
  pants: '하의',
  bottom: '하의',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
};

type OutfitSet = {
  id: string;
  summary: string;
  items: OutfitItem[];
};

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

function getOutfitCategoryRank(category: string) {
  const normalizedCategory = category.toLowerCase();
  const rank = outfitCategoryOrder.indexOf(normalizedCategory);
  return rank === -1 ? outfitCategoryOrder.length : rank;
}

function getOutfitCategoryLabel(category: string) {
  return outfitCategoryLabels[category.toLowerCase()] ?? category;
}

export function HomeScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const [outfitSets, setOutfitSets] = useState<OutfitSet[]>([]);
  const [activeOutfitIndex, setActiveOutfitIndex] = useState(0);
  const [outfitCarouselWidth, setOutfitCarouselWidth] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshingRecommendations, setIsRefreshingRecommendations] = useState(false);
  const [isBottomPullArmed, setIsBottomPullArmed] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0);
  const [error, setError] = useState('');
  const requestKeyRef = useRef(0);
  const refreshSeedRef = useRef(0);
  const listRef = useRef<FlatList<Product>>(null);
  const scrollOffsetRef = useRef(0);
  const distanceFromBottomRef = useRef(Number.POSITIVE_INFINITY);
  const refreshCountRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const dragStartedAtBottomRef = useRef(false);
  const isBottomPullArmedRef = useRef(false);
  const wheelRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setBottomPullArmed = useCallback((nextValue: boolean) => {
    isBottomPullArmedRef.current = nextValue;
    setIsBottomPullArmed(nextValue);
  }, []);

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

  const recommendationToOutfitItems = useCallback((recommendation: Recommendation): OutfitItem[] => (
    [...recommendation.items]
      .sort((left, right) => getOutfitCategoryRank(left.category) - getOutfitCategoryRank(right.category))
      .slice(0, 5)
  ), []);

  const recommendationToOutfitSet = useCallback((recommendation: Recommendation, refreshSeed: number): OutfitSet => ({
    id: `${recommendation.id}-${refreshSeed}`,
    summary: recommendation.summary,
    items: recommendationToOutfitItems(recommendation),
  }), [recommendationToOutfitItems]);

  const hydrateOutfitSetPreviews = useCallback((baseQuery: string, baseSeed: number, firstRecommendation: Recommendation, requestKey: number) => {
    const firstSet = recommendationToOutfitSet(firstRecommendation, baseSeed);
    setOutfitSets([firstSet]);
    setActiveOutfitIndex(0);

    const previewSeeds = Array.from({ length: outfitSetPreviewCount - 1 }, (_, index) => baseSeed + index + 1);
    Promise.all(
      previewSeeds.map((previewSeed) => getHomeRecommendation(baseQuery.trim(), previewSeed)
        .then((recommendation) => recommendationToOutfitSet(recommendation, previewSeed))),
    )
      .then((previewSets) => {
        if (requestKeyRef.current !== requestKey) {
          return;
        }

        setOutfitSets([firstSet, ...previewSets]);
      })
      .catch(() => {
        if (requestKeyRef.current === requestKey) {
          setOutfitSets([firstSet]);
        }
      });
  }, [recommendationToOutfitSet]);

  const loadProducts = useCallback((nextQuery = '', refreshSeed = 0, showInitialLoader = true) => {
    const requestKey = requestKeyRef.current + 1;
    requestKeyRef.current = requestKey;

    if (showInitialLoader) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshingRecommendations(true);
    }
    setBottomPullArmed(false);
    setError('');
    getHomeRecommendation(nextQuery.trim(), refreshSeed)
      .then((recommendation: Recommendation) => {
        if (requestKeyRef.current !== requestKey) {
          return;
        }

        const nextProducts = recommendationToProducts(recommendation, refreshSeed);
        setProducts(nextProducts);
        hydrateOutfitSetPreviews(nextQuery, refreshSeed, recommendation, requestKey);
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
  }, [hydrateOutfitSetPreviews, recommendationToProducts, setBottomPullArmed]);

  const refreshRecommendationSet = useCallback(() => {
    loadProducts(query, refreshSeedRef.current + 1, false);
  }, [loadProducts, query]);

  const getCooldownRemainingSeconds = useCallback(() => (
    Math.max(0, Math.ceil((cooldownUntilRef.current - Date.now()) / 1000))
  ), []);

  const startRefreshCooldown = useCallback(() => {
    cooldownUntilRef.current = Date.now() + refreshCooldownMs;
    setCooldownRemainingSeconds(getCooldownRemainingSeconds());
  }, [getCooldownRemainingSeconds]);

  const canStartRefresh = useCallback(() => {
    const remainingSeconds = getCooldownRemainingSeconds();
    if (remainingSeconds > 0) {
      setCooldownRemainingSeconds(remainingSeconds);
      setError(`${Math.ceil(remainingSeconds / 60)}분 후에 다시 새 추천을 받을 수 있어요.`);
      return false;
    }

    if (refreshCountRef.current >= refreshLimitPerSession) {
      startRefreshCooldown();
      setError('새 추천은 잠시 후 다시 받을 수 있어요.');
      return false;
    }

    return true;
  }, [getCooldownRemainingSeconds, startRefreshCooldown]);

  const requestRefreshRecommendationSet = useCallback(() => {
    if (isInitialLoading || isRefreshingRecommendations || products.length === 0 || !canStartRefresh()) {
      return;
    }

    const nextRefreshCount = refreshCountRef.current + 1;
    refreshCountRef.current = nextRefreshCount;
    setRefreshCount(nextRefreshCount);
    if (nextRefreshCount >= refreshLimitPerSession) {
      startRefreshCooldown();
    }

    refreshRecommendationSet();
  }, [canStartRefresh, isInitialLoading, isRefreshingRecommendations, products.length, refreshRecommendationSet, startRefreshCooldown]);

  const handleEndReached = useCallback(() => {
    if (!isInitialLoading && !isRefreshingRecommendations && products.length > 0) {
      setBottomPullArmed(false);
    }
  }, [isInitialLoading, isRefreshingRecommendations, products.length, setBottomPullArmed]);

  const handlePullRefresh = useCallback(() => {
    requestRefreshRecommendationSet();
  }, [requestRefreshRecommendationSet]);

  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(category);
    setQuery(category);
    loadProducts(category, 0, true);
  }, [loadProducts]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    scrollOffsetRef.current = contentOffset.y;
    distanceFromBottomRef.current = contentSize.height - layoutMeasurement.height - contentOffset.y;

    if (distanceFromBottomRef.current <= edgeThreshold) {
      handleEndReached();
    }

    if (
      dragStartedAtBottomRef.current &&
      distanceFromBottomRef.current <= -bottomPullThreshold &&
      !isRefreshingRecommendations
    ) {
      setBottomPullArmed(true);
    }
  }, [handleEndReached, isRefreshingRecommendations, setBottomPullArmed]);

  const handleScrollBeginDrag = useCallback(() => {
    dragStartedAtBottomRef.current = distanceFromBottomRef.current <= edgeThreshold;
    setBottomPullArmed(
      dragStartedAtBottomRef.current &&
      !isInitialLoading &&
      !isRefreshingRecommendations &&
      products.length > 0 &&
      getCooldownRemainingSeconds() <= 0 &&
      refreshCountRef.current < refreshLimitPerSession,
    );
  }, [getCooldownRemainingSeconds, isInitialLoading, isRefreshingRecommendations, products.length, setBottomPullArmed]);

  const handleScrollEndDrag = useCallback(() => {
    if (dragStartedAtBottomRef.current && isBottomPullArmedRef.current) {
      setBottomPullArmed(false);
      requestRefreshRecommendationSet();
    }
    dragStartedAtBottomRef.current = false;
    setBottomPullArmed(false);
  }, [requestRefreshRecommendationSet, setBottomPullArmed]);

  const handleOutfitCarouselLayout = useCallback((event: LayoutChangeEvent) => {
    setOutfitCarouselWidth(event.nativeEvent.layout.width);
  }, []);

  const handleOutfitMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (outfitCarouselWidth <= 0) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / outfitCarouselWidth);
    setActiveOutfitIndex(Math.min(Math.max(nextIndex, 0), Math.max(outfitSets.length - 1, 0)));
  }, [outfitCarouselWidth, outfitSets.length]);

  const wheelHandlers = {
    onWheel: (event: { nativeEvent?: { deltaY?: number }; deltaY?: number }) => {
      const deltaY = event.nativeEvent?.deltaY ?? event.deltaY ?? 0;
      if (deltaY > 0 && distanceFromBottomRef.current <= edgeThreshold) {
        dragStartedAtBottomRef.current = true;
        setBottomPullArmed(true);
        if (wheelRefreshTimerRef.current) {
          clearTimeout(wheelRefreshTimerRef.current);
        }
        wheelRefreshTimerRef.current = setTimeout(() => {
          handleScrollEndDrag();
        }, 500);
      }
    },
    onMouseUp: handleScrollEndDrag,
    onTouchEnd: handleScrollEndDrag,
  };

  useEffect(() => {
    loadProducts('', 0, true);
  }, [loadProducts]);

  useEffect(() => () => {
    if (wheelRefreshTimerRef.current) {
      clearTimeout(wheelRefreshTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (cooldownRemainingSeconds <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      const remainingSeconds = getCooldownRemainingSeconds();
      setCooldownRemainingSeconds(remainingSeconds);
      if (remainingSeconds <= 0) {
        refreshCountRef.current = 0;
        setRefreshCount(0);
        setError('');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemainingSeconds, getCooldownRemainingSeconds]);

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

      {outfitSets.length > 0 ? (
        <View style={styles.outfitCard}>
          <View style={styles.outfitHeader}>
            <View>
              <Text style={styles.outfitEyebrow}>AI 추천 세트</Text>
              <Text style={styles.outfitTitle}>오늘의 추천 코디</Text>
            </View>
            <Ionicons name="sparkles-outline" size={20} color={colors.accentTeal} />
          </View>
          <View style={styles.outfitCarousel} onLayout={handleOutfitCarouselLayout}>
            <FlatList
              data={outfitSets}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={handleOutfitMomentumEnd}
              renderItem={({ item: outfitSet }) => (
                <View style={[styles.outfitPage, { width: outfitCarouselWidth || 1 }]}>
                  {outfitSet.summary ? (
                    <Text style={styles.outfitSummary} numberOfLines={3}>
                      {outfitSet.summary}
                    </Text>
                  ) : null}
                  <View style={styles.outfitItems}>
                    {outfitSet.items.map((item) => (
                      <View key={item.id} style={styles.outfitItem}>
                        <View style={styles.outfitImage}>
                          {item.product?.imageUrl ? (
                            <Image source={{ uri: item.product.imageUrl }} style={styles.outfitProductImage} resizeMode="cover" />
                          ) : (
                            <Ionicons name="shirt-outline" size={24} color={colors.primary} />
                          )}
                        </View>
                        <View style={styles.outfitInfo}>
                          <Text style={styles.outfitCategory}>{getOutfitCategoryLabel(item.category)}</Text>
                          <Text style={styles.outfitBrand} numberOfLines={1}>{item.product?.brand ?? 'AID-FIT'}</Text>
                          <Text style={styles.outfitName} numberOfLines={2}>{item.name}</Text>
                          <Text style={styles.outfitPrice}>
                            {item.product?.price === null || item.product?.price === undefined
                              ? '가격 미정'
                              : `${item.product.price.toLocaleString('ko-KR')}원`}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            />
          </View>
          <View style={styles.outfitPagination}>
            {outfitSets.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.outfitPaginationDot,
                  index === activeOutfitIndex ? styles.outfitPaginationDotActive : null,
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}

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
      <View style={styles.feed} {...wheelHandlers}>
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
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          scrollEventThrottle={16}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.42}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshingRecommendations && scrollOffsetRef.current <= 0}
              onRefresh={handlePullRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
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
                ) : isBottomPullArmed ? (
                  <>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.footerText}>새 추천을 불러오는 중이에요</Text>
                  </>
                ) : cooldownRemainingSeconds > 0 ? (
                  <Text style={styles.footerText}>
                    {Math.ceil(cooldownRemainingSeconds / 60)}분 후 새 추천을 다시 받을 수 있어요
                  </Text>
                ) : (
                  <Text style={styles.footerText}>
                    {endReachedMessage} ({refreshCount}/{refreshLimitPerSession})
                  </Text>
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
  outfitCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hairlineLight,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  outfitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  outfitEyebrow: {
    color: colors.accentTeal,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
  },
  outfitTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  outfitSummary: {
    color: colors.subText,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  outfitItems: {
    gap: spacing.sm,
  },
  outfitCarousel: {
    minHeight: 548,
  },
  outfitPage: {
    gap: spacing.md,
  },
  outfitPagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  outfitPaginationDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.ashLight,
  },
  outfitPaginationDotActive: {
    width: 22,
    backgroundColor: colors.accentTeal,
  },
  outfitItem: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineLight,
  },
  outfitImage: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceFilter,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outfitProductImage: {
    width: 64,
    height: 64,
  },
  outfitInfo: {
    flex: 1,
    minWidth: 0,
  },
  outfitCategory: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
  },
  outfitBrand: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  outfitName: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  outfitPrice: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
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
