import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from '../../components/common/AppTextInput';
import { Chip } from '../../components/common/Chip';
import { AgentProgress, type ProgressStep } from '../../components/fashion/AgentProgress';
import { ProductCard } from '../../components/fashion/ProductCard';
import { ProductGridSkeleton } from '../../components/fashion/ProductGridSkeleton';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { getHomeRecommendation, streamHomeRecommendation } from '../../services/recommendationService';
import { readCache, writeCache } from '../../utils/cache';
import type { AppliedFilters, Product, Recommendation } from '../../types/fashion';

// 카탈로그(product_vectors.category)에 실제로 들어 있는 값이어야 타일이 걸린다.
// 백엔드 _HOME_CATEGORIES와 같은 목록이다.
const allCategory = '전체';
const categories = ['상의', '바지', '아우터', '신발', '가방', '모자', '원피스/스커트'];
const endReachedMessage = '모든 추천 아이템을 보았어요! 위의 새로고침 버튼으로 새 추천을 받아보세요.';
const refreshLimitPerSession = 5;
const refreshCooldownMs = 5 * 60 * 1000;
// 홈 추천은 진입할 때마다 Gemini를 호출해 응답이 10초 안팎 걸리고 비용도 든다.
// 사용자가 직접 새로고침하기 전까지는 최근 결과를 다시 보여준다.
const homeCacheKeyPrefix = 'aidfit_home_recommendation';
const homeCacheTtlMs = 30 * 60 * 1000;
// 첫 화면을 덮을 만큼만 그린다. 백엔드는 이보다 훨씬 많은 타일을 보내지만
// 스켈레톤을 그만큼 그려도 보이지 않는 자리라 렌더 비용만 든다.
const homeTileCount = 8;

/**
 * 서버에 보내는 조건.
 *
 * 카테고리는 여기 없다. 카탈로그 분류는 이미 받아 둔 타일에서 걸러 낼 수
 * 있는 값이라 AI를 다시 부를 이유가 없다. 자연어 요청만 AI가 해석해야 한다.
 */
type HomeConditions = {
  prompt: string;
};

/**
 * 캐시에 담는 화면 상태.
 *
 * 타일만 저장하면 캐시로 복원했을 때 "적용된 조건"과 AI 한마디가 직전
 * 조건의 것으로 남는다. 화면에 함께 뜨는 것들이므로 함께 저장한다.
 */
type CachedHomeView = {
  products: Product[];
  applied: AppliedFilters | null;
  message: string;
};

// 조건마다 캐시를 따로 둔다. 하나의 키를 쓰면 "바지"를 검색한 결과가 기본
// 피드 자리에 저장돼, 다음 진입에 조건 없이도 되살아난다.
function cacheKeyFor({ prompt }: HomeConditions): string {
  return `${homeCacheKeyPrefix}:${prompt}`;
}

// 서버가 진행을 보내 주지 않는 환경(네이티브에는 fetch 스트림이 없다)에서 쓸
// 예상 단계. 실측 13초를 나눠 잡았고, 마지막 단계는 응답이 올 때까지 머문다.
const estimatedSteps: { node: string; label: string; afterMs: number }[] = [
  { node: 'intent', label: '무엇을 찾는지 파악하고 있어요', afterMs: 0 },
  { node: 'refine', label: '검색어를 다듬고 있어요', afterMs: 1500 },
  { node: 'plan', label: '어디서 찾을지 정하고 있어요', afterMs: 3000 },
  { node: 'search', label: '상품 12,794건에서 고르고 있어요', afterMs: 4500 },
  { node: 'rank', label: '취향에 맞게 순서를 매기고 있어요', afterMs: 7000 },
  { node: 'compose', label: '추천 이유를 정리하고 있어요', afterMs: 9000 },
];

function describeFailure(error: unknown): string {
  const status = (error as { status?: number | null })?.status;
  if (status === 401 || status === 403) {
    return '다시 로그인한 뒤 시도해 주세요.';
  }
  if (status !== null && status !== undefined && status >= 500) {
    return '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
  }
  const message = String((error as { message?: string })?.message ?? '');
  if (/timeout|aborted/i.test(message)) {
    return '추천을 만드는 데 시간이 너무 오래 걸렸어요. 다시 시도해 주세요.';
  }
  return '추천을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.';
}

export function HomeScreen() {
  const [query, setQuery] = useState('');
  // 고른 카테고리. 비어 있으면 "전체"다. 여러 개를 함께 고를 수 있다.
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [applied, setApplied] = useState<AppliedFilters | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [isProgressLive, setIsProgressLive] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshingRecommendations, setIsRefreshingRecommendations] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0);
  const [error, setError] = useState('');
  const requestKeyRef = useRef(0);
  const refreshSeedRef = useRef(0);
  const listRef = useRef<FlatList<Product>>(null);
  const refreshCountRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const estimateTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearEstimateTimers = useCallback(() => {
    estimateTimersRef.current.forEach(clearTimeout);
    estimateTimersRef.current = [];
  }, []);

  const recommendationToProducts = useCallback((recommendation: Recommendation, refreshSeed: number): Product[] => (
    recommendation.items.map((item, index) => ({
      id: `${item.product?.id ?? item.id}-${refreshSeed}-${index}`,
      brand: item.product?.brand ?? 'AID-FIT',
      name: item.name,
      category: item.category,
      price: item.product?.price === null || item.product?.price === undefined
        ? '가격 미정'
        : `${item.product.price.toLocaleString('ko-KR')}원`,
      tags: [item.category],
      imageTone: item.imageTone,
      imageUrl: item.product?.imageUrl,
      productUrl: item.product?.productUrl,
      reason: item.reason,
      // 이유가 붙은 타일만 AI가 직접 고른 것이다. 나머지는 검색·랭킹 결과를
      // 그대로 실은 것이라 배지를 달면 거짓이 된다.
      aiRecommended: Boolean(item.reason),
    }))
  ), []);

  const loadProducts = useCallback((
    conditions: HomeConditions,
    refreshSeed = 0,
    showInitialLoader = true,
  ) => {
    const requestKey = requestKeyRef.current + 1;
    requestKeyRef.current = requestKey;
    const isCurrent = () => requestKeyRef.current === requestKey;

    if (showInitialLoader) {
      // 조건이 바뀐 요청이다. 이전 결과를 남겨 두면 새 조건과 맞지 않는 타일이
      // 그대로 보여 검색이 안 된 것처럼 읽힌다.
      setIsInitialLoading(true);
      setProducts([]);
      setApplied(null);
      setAiMessage('');
    } else {
      setIsRefreshingRecommendations(true);
    }
    setError('');
    setProgressSteps([]);
    setIsProgressLive(true);
    clearEstimateTimers();

    const params = {
      prompt: conditions.prompt,
      refreshSeed,
    };

    const startEstimating = () => {
      // 서버 진행을 못 받는 환경이다. 시간 기반으로 같은 목록을 진행시키되
      // "예상"임을 화면에 밝힌다.
      setIsProgressLive(false);
      estimateTimersRef.current = estimatedSteps.map((step) =>
        setTimeout(() => {
          if (isCurrent()) {
            setProgressSteps((current) => [...current, { node: step.node, label: step.label }]);
          }
        }, step.afterMs),
      );
    };

    const appendStep = (step: ProgressStep) => {
      if (isCurrent()) {
        setProgressSteps((current) => [...current, step]);
      }
    };

    streamHomeRecommendation(params, appendStep)
      .catch((streamError: unknown) => {
        if (!isCurrent()) {
          throw streamError;
        }
        // 스트리밍이 막힌 환경이면 일반 요청으로 결과는 받아 낸다.
        startEstimating();
        return getHomeRecommendation(params);
      })
      .then((recommendation: Recommendation) => {
        if (!isCurrent()) {
          return;
        }

        const view: CachedHomeView = {
          products: recommendationToProducts(recommendation, refreshSeed),
          applied: recommendation.appliedFilters ?? null,
          message: recommendation.title || '',
        };
        setProducts(view.products);
        setApplied(view.applied);
        setAiMessage(view.message);
        refreshSeedRef.current = refreshSeed;
        void writeCache(cacheKeyFor(conditions), view);
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      })
      .catch((failure: unknown) => {
        if (isCurrent()) {
          setError(describeFailure(failure));
        }
      })
      .finally(() => {
        clearEstimateTimers();
        if (isCurrent()) {
          setProgressSteps([]);
          setIsInitialLoading(false);
          setIsRefreshingRecommendations(false);
        }
      });
  }, [clearEstimateTimers, recommendationToProducts]);

  const conditions: HomeConditions = { prompt: query.trim() };

  const refreshRecommendationSet = useCallback(() => {
    loadProducts(conditions, refreshSeedRef.current + 1, false);
  }, [conditions.prompt, loadProducts]);

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

  // 검색·필터는 사용자가 명시적으로 요청한 것이라 새로고침 횟수를 소모하지
  // 않는다. 같은 조건을 다시 고르면 캐시가 있어 재호출도 없다.
  const search = useCallback(async (next: HomeConditions) => {
    const cached = await readCache<CachedHomeView>(cacheKeyFor(next), homeCacheTtlMs);
    if (cached?.products?.length) {
      // 진행 중인 요청이 뒤늦게 도착해 캐시 결과를 덮어쓰지 않도록 무효화한다.
      requestKeyRef.current += 1;
      clearEstimateTimers();
      setProducts(cached.products);
      setApplied(cached.applied ?? null);
      setAiMessage(cached.message ?? '');
      setError('');
      setProgressSteps([]);
      setIsInitialLoading(false);
      setIsRefreshingRecommendations(false);
      return;
    }
    loadProducts(next, 0, true);
  }, [clearEstimateTimers, loadProducts]);

  // 칩은 이미 받아 둔 타일을 거르기만 한다. AI를 다시 부르지 않으므로
  // 기다릴 일도, 새로고침 예산을 쓸 일도 없다.
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((current) => (
      current.includes(category)
        ? current.filter((selected) => selected !== category)
        : [...current, category]
    ));
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const clearCategories = useCallback(() => {
    setSelectedCategories([]);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const clearPrompt = useCallback(() => {
    setQuery('');
    void search({ prompt: '' });
  }, [search]);

  // 카테고리마다 지금 몇 칸이 걸리는지. 눌러 보기 전에 알 수 있어야
  // 빈 화면을 만나지 않는다.
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    });
    return counts;
  }, [products]);

  const visibleProducts = useMemo(() => (
    selectedCategories.length === 0
      ? products
      : products.filter((product) => selectedCategories.includes(product.category))
  ), [products, selectedCategories]);

  const canRefresh = !isInitialLoading && !isRefreshingRecommendations && cooldownRemainingSeconds <= 0;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const initial: HomeConditions = { prompt: '' };
      const cached = await readCache<CachedHomeView>(cacheKeyFor(initial), homeCacheTtlMs);
      if (cancelled) {
        return;
      }

      if (cached?.products?.length) {
        setProducts(cached.products);
        setApplied(cached.applied ?? null);
        setAiMessage(cached.message ?? '');
        setIsInitialLoading(false);
        return;
      }

      loadProducts(initial, 0, true);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadProducts]);

  useEffect(() => clearEstimateTimers, [clearEstimateTimers]);

  // 새 피드에 없는 카테고리가 골라진 채로 남으면 타일이 하나도 없는 화면이 된다.
  useEffect(() => {
    setSelectedCategories((current) => {
      const available = current.filter((category) => categoryCounts.has(category));
      return available.length === current.length ? current : available;
    });
  }, [categoryCounts]);

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
        {/* 브라우저 새로고침으로는 캐시된 추천이 그대로 다시 뜬다.
            새 추천을 받는 길은 이 버튼뿐이므로 항상 보이는 자리에 둔다. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="새 추천 받기"
          onPress={requestRefreshRecommendationSet}
          disabled={!canRefresh}
          style={({ pressed }) => [
            styles.refreshButton,
            !canRefresh && styles.refreshButtonDisabled,
            pressed && canRefresh && styles.refreshButtonPressed,
          ]}
        >
          {isRefreshingRecommendations ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={20} color={canRefresh ? colors.primary : colors.subText} />
          )}
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={colors.subText} />
        <AppTextInput
          placeholder="오늘 코디에 추가로 원하는 점을 입력하세요"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => void search(conditions)}
          style={styles.searchInput}
        />
      </View>

      {/* 카테고리가 여덟 종이라 줄바꿈하면 헤더가 세 줄로 불어나 상품
          그리드가 화면 밖으로 밀린다. 고른 칩은 아래 "적용된 조건"에도
          남으므로 가로로 흘려도 무엇을 골랐는지 놓치지 않는다. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
      >
        <Chip
          label={allCategory}
          selected={selectedCategories.length === 0}
          count={products.length}
          onPress={clearCategories}
        />
        {categories.map((category) => {
          const count = categoryCounts.get(category) ?? 0;
          return (
            <Chip
              key={category}
              label={category}
              count={count}
              // 이번 피드에 없는 카테고리다. 눌러 봐야 빈 화면만 나온다.
              disabled={count === 0}
              selected={selectedCategories.includes(category)}
              onPress={() => toggleCategory(category)}
            />
          );
        })}
      </ScrollView>

      {/* 무엇으로 찾았는지 보이지 않으면 결과가 왜 이런지 알 수 없다.
          각 조건은 눌러서 해제할 수 있다. */}
      {applied && !isInitialLoading ? (
        <View style={styles.conditions}>
          <Text style={styles.conditionsLabel}>적용된 조건</Text>
          {applied.ageRange ? <Text style={styles.conditionTag}>{applied.ageRange}</Text> : null}
          {applied.preferredStyles.map((style) => (
            <Text key={style} style={styles.conditionTag}>{style}</Text>
          ))}
          {selectedCategories.map((category) => (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityLabel={`카테고리 ${category} 해제`}
              onPress={() => toggleCategory(category)}
            >
              <Text style={[styles.conditionTag, styles.conditionTagRemovable]}>
                {category} ✕
              </Text>
            </Pressable>
          ))}
          {applied.prompt ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`검색어 ${applied.prompt} 해제`}
              onPress={clearPrompt}
            >
              <Text style={[styles.conditionTag, styles.conditionTagRemovable]}>
                “{applied.prompt}” ✕
              </Text>
            </Pressable>
          ) : null}
          {/* 서버가 준 개수가 아니라 지금 화면에 걸린 개수다. 칩을 누르면
              바로 줄어들어야 필터가 걸렸다는 것이 보인다. */}
          <Text style={styles.conditionsCount}>{visibleProducts.length}건</Text>
        </View>
      ) : null}

      {aiMessage && products.length > 0 && !isInitialLoading ? (
        <View style={styles.aiNote}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.aiNoteText}>{aiMessage}</Text>
        </View>
      ) : null}

      {/* 검색·필터·새로고침 어느 경로든 기다리는 동안 같은 진행 표시를 본다.
          목록이 비었을 때만 뜨는 ListEmptyComponent에 두면 타일이 남아 있는
          검색 경로에서는 아무것도 보이지 않는다. */}
      <AgentProgress steps={progressSteps} live={isProgressLive} />
    </>
  );

  // 칩은 이번 피드에 있는 카테고리만 누를 수 있어 보통 여기까지 오지 않는다.
  // 검색으로 좁힌 뒤 결과가 없을 때가 실제로 마주치는 경우다.
  const emptyMessage = selectedCategories.length > 0
    ? '고른 카테고리에 남은 추천이 없어요. 카테고리를 해제해 보세요.'
    : applied?.prompt
      ? '이 조건에 맞는 상품을 찾지 못했어요. 위의 조건을 하나 빼고 다시 찾아보세요.'
      : '표시할 추천이 없어요.';

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.feed}>
        <FlatList
          ref={listRef}
          data={visibleProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          ListHeaderComponent={header}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          style={styles.feedList}
          ListEmptyComponent={
            isInitialLoading ? (
              <ProductGridSkeleton count={homeTileCount} />
            ) : (
              <Text style={styles.stateText}>{error || emptyMessage}</Text>
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
  conditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  conditionsLabel: {
    color: colors.subText,
    fontSize: typography.small,
    marginRight: spacing.xs,
  },
  conditionTag: {
    color: colors.subText,
    fontSize: typography.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
  },
  conditionTagRemovable: {
    color: colors.primary,
    backgroundColor: colors.navySoft,
  },
  conditionsCount: {
    color: colors.subText,
    fontSize: typography.small,
    marginLeft: 'auto',
  },
  aiNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.navySoft,
  },
  aiNoteText: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshButtonPressed: {
    opacity: 0.6,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  greeting: {
    flex: 1,
    minWidth: 0,
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
  chipsScroll: {
    // 세로 목록 안의 가로 스크롤이다. 남은 높이를 다 먹지 않게 막는다.
    flexGrow: 0,
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
