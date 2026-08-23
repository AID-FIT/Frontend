import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AppTextInput } from '../../components/common/AppTextInput';
import { Chip } from '../../components/common/Chip';
import { ProductCard } from '../../components/fashion/ProductCard';
import { ProductGridSkeleton } from '../../components/fashion/ProductGridSkeleton';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { getHomeRecommendation } from '../../services/recommendationService';
import { readCache, writeCache } from '../../utils/cache';
import type { Product, Recommendation } from '../../types/fashion';

const categories = ['캐주얼', '여름', '미니멀', '데이트룩'];
const endReachedMessage = '모든 추천 아이템을 보았어요! 아래로 당겨 새롭게 아이템을 추천해드릴게요!';
const edgeThreshold = 24;
const bottomPullThreshold = 36;
const refreshLimitPerSession = 5;
const refreshCooldownMs = 5 * 60 * 1000;
// 홈 추천은 진입할 때마다 Gemini를 호출해 응답이 10초 안팎 걸리고 비용도 든다.
// 사용자가 직접 새로고침하기 전까지는 최근 결과를 다시 보여준다.
const homeCacheKey = 'aidfit_home_recommendation';
const homeCacheTtlMs = 30 * 60 * 1000;
// 백엔드가 채워 보내는 타일 수(_HOME_TILE_COUNT)와 맞춘다. 스켈레톤이 더 적으면
// 로딩이 끝나는 순간 목록이 늘어나며 화면이 튄다.
const homeTileCount = 8;

export function HomeScreen() {
  const [query, setQuery] = useState('');
  // 칩은 아무것도 고르지 않은 상태로 시작한다. 첫 진입은 옷장·취향만으로 추천한다.
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
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
      productUrl: item.product?.productUrl,
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
    setBottomPullArmed(false);
    setError('');
    getHomeRecommendation(nextQuery.trim(), refreshSeed)
      .then((recommendation: Recommendation) => {
        if (requestKeyRef.current !== requestKey) {
          return;
        }

        const nextProducts = recommendationToProducts(recommendation, refreshSeed);
        setProducts(nextProducts);
        refreshSeedRef.current = refreshSeed;
        // 캐시는 "그냥 홈에 들어왔을 때" 보여줄 기본 추천만 담는다. 검색 결과를
        // 같은 키에 쓰면 다음 진입에서 검색어 없이도 그 결과가 되살아난다.
        if (!nextQuery.trim()) {
          void writeCache(homeCacheKey, nextProducts);
        }
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
  }, [recommendationToProducts, setBottomPullArmed]);

  // 칩(무드)과 입력창(자유 요청)은 둘 다 "추가로 원하는 점"이라 함께 보낸다.
  // 한쪽이 다른 쪽을 덮어쓰면 방금 입력한 요청이 조용히 사라진다.
  const searchTerm = [selectedCategory, query.trim()].filter(Boolean).join(' ');

  const refreshRecommendationSet = useCallback(() => {
    loadProducts(searchTerm, refreshSeedRef.current + 1, false);
  }, [loadProducts, searchTerm]);

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
    // 같은 칩을 다시 누르면 해제한다. 해제할 방법이 없으면 한 번 누른 뒤로는
    // 취향 기반 기본 추천으로 돌아갈 수 없다.
    const nextCategory = selectedCategory === category ? '' : category;
    setSelectedCategory(nextCategory);
    loadProducts([nextCategory, query.trim()].filter(Boolean).join(' '), 0, true);
  }, [loadProducts, query, selectedCategory]);

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
    let cancelled = false;

    (async () => {
      const cached = await readCache<Product[]>(homeCacheKey, homeCacheTtlMs);
      if (cancelled) {
        return;
      }

      if (cached && cached.length > 0) {
        setProducts(cached);
        setIsInitialLoading(false);
        return;
      }

      loadProducts('', 0, true);
    })();

    return () => {
      cancelled = true;
    };
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

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={colors.subText} />
        <AppTextInput
          placeholder="오늘 코디에 추가로 원하는 점을 입력하세요"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => loadProducts(searchTerm, 0, true)}
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
            isInitialLoading ? (
              <ProductGridSkeleton count={homeTileCount} />
            ) : (
              <Text style={styles.stateText}>{error || '표시할 추천이 없어요.'}</Text>
            )
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
