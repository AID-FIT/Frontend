import renderer, { type ReactTestInstance } from 'react-test-renderer';
import { HomeScreen } from './HomeScreen';
import {
  getHomeRecommendation,
  streamHomeRecommendation,
  type AgentProgressStep,
} from '../../services/recommendationService';
import { readCache, writeCache } from '../../utils/cache';
import type { Recommendation } from '../../types/fashion';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../../services/recommendationService', () => ({
  getHomeRecommendation: jest.fn(),
  streamHomeRecommendation: jest.fn(),
}));
jest.mock('../../utils/cache', () => ({
  readCache: jest.fn(),
  writeCache: jest.fn().mockResolvedValue(undefined),
}));

const requestHome = getHomeRecommendation as jest.MockedFunction<typeof getHomeRecommendation>;
const streamHome = streamHomeRecommendation as jest.MockedFunction<typeof streamHomeRecommendation>;
const cacheRead = readCache as jest.MockedFunction<typeof readCache>;
const cacheWrite = writeCache as jest.MockedFunction<typeof writeCache>;

function recommendation(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    id: 'rec_1',
    title: '오늘은 미니멀하게',
    summary: '오늘은 미니멀하게',
    tags: ['바지'],
    appliedFilters: {
      category: null,
      mood: null,
      season: null,
      ageRange: '20대',
      preferredStyles: ['스트릿'],
      prompt: '',
      resultCount: 1,
    },
    items: [
      {
        id: 'item_1',
        name: '와이드 슬랙스',
        category: '바지',
        reason: '검정 상의와 잘 어울려요',
        imageTone: '#f5f7fa',
        product: {
          id: 'musinsa_1',
          itemId: 'musinsa_1',
          source: 'musinsa',
          brand: 'Example',
          price: 59000,
          imageUrl: 'https://image.example/1.jpg',
          productUrl: 'https://www.musinsa.com/products/1',
        },
      },
    ],
    ...overrides,
  };
}

// 홈은 캐시 조회와 요청이 모두 비동기고, FlatList도 setTimeout으로 셀을
// 갱신한다. act 한 번으로는 상태가 정착하지 않고, 남은 타이머가 act 밖에서
// 터져 경고를 낸다.
async function settle(): Promise<void> {
  await renderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    jest.runOnlyPendingTimers();
  });
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<HomeScreen />);
  });
  await settle();
  return tree;
}

function byLabel(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  return tree.root.find((node) => node.props.accessibilityLabel === label);
}

function chip(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  return tree.root.find(
    (node) => node.props.label === label && typeof node.props.onPress === 'function',
  );
}

function searchInput(tree: renderer.ReactTestRenderer): ReactTestInstance {
  return tree.root.find((node) => typeof node.props.onSubmitEditing === 'function');
}

function texts(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((node) => typeof node.type === 'string' && node.children.length > 0)
    .flatMap((node) => node.children)
    .filter((child): child is string => typeof child === 'string');
}

async function press(node: ReactTestInstance): Promise<void> {
  await renderer.act(async () => {
    node.props.onPress();
  });
  await settle();
}

async function type(tree: renderer.ReactTestRenderer, value: string): Promise<void> {
  await renderer.act(async () => {
    searchInput(tree).props.onChangeText(value);
  });
}

async function submit(tree: renderer.ReactTestRenderer): Promise<void> {
  await renderer.act(async () => {
    searchInput(tree).props.onSubmitEditing();
  });
  await settle();
}

/**
 * 카테고리가 여럿 섞인 피드.
 *
 * 칩이 서버가 아니라 이미 받아 둔 타일을 거르므로, 필터를 확인하려면 한
 * 응답 안에 여러 카테고리가 들어 있어야 한다.
 */
function feed(categories: string[]): Recommendation {
  return recommendation({
    items: categories.map((category, index) => ({
      id: `item_${index}`,
      name: `${category} 아이템 ${index}`,
      category,
      // 이유는 LLM이 고른 앞쪽 타일에만 붙는다. 뒤쪽은 검색 결과 그대로다.
      reason: index === 0 ? '검정 상의와 잘 어울려요' : '',
      imageTone: '#f5f7fa',
      product: {
        id: `musinsa_${index}`,
        itemId: `musinsa_${index}`,
        source: 'musinsa',
        brand: 'Example',
        price: 59000,
        imageUrl: `https://image.example/${index}.jpg`,
        productUrl: `https://www.musinsa.com/products/${index}`,
      },
    })),
  });
}

function lastParams(): Record<string, unknown> {
  const calls = streamHome.mock.calls;
  return calls[calls.length - 1][0] as Record<string, unknown>;
}

beforeEach(() => {
  jest.useFakeTimers();
  streamHome.mockReset();
  requestHome.mockReset();
  cacheRead.mockReset();
  cacheWrite.mockClear();
  streamHome.mockResolvedValue(recommendation());
  requestHome.mockResolvedValue(recommendation());
  cacheRead.mockResolvedValue(null);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('HomeScreen filters', () => {
  it('asks for taste-based recommendations on first load', async () => {
    await mount();

    expect(lastParams()).toMatchObject({ prompt: '' });
  });

  it('never sends a category to the agent', async () => {
    // 카탈로그 분류는 이미 받아 둔 타일에서 거를 수 있다. 서버로 보내면
    // 칩 하나에 13초짜리 에이전트가 통째로 다시 돈다.
    streamHome.mockResolvedValue(feed(['상의', '바지']));
    const tree = await mount();

    await press(chip(tree, '바지'));

    expect(lastParams()).not.toHaveProperty('category');
  });

  it('filters the loaded tiles without calling the agent again', async () => {
    streamHome.mockResolvedValue(feed(['상의', '바지']));
    const tree = await mount();
    const before = streamHome.mock.calls.length;

    await press(chip(tree, '바지'));

    expect(streamHome.mock.calls.length).toBe(before);
  });

  it('shows only the tiles in the chosen category', async () => {
    streamHome.mockResolvedValue(feed(['상의', '바지']));
    const tree = await mount();

    await press(chip(tree, '바지'));
    const shown = texts(tree);

    expect(shown).toContain('바지 아이템 1');
    expect(shown).not.toContain('상의 아이템 0');
  });

  it('adds a second category instead of replacing the first', async () => {
    // 하나만 고를 수 있으면 "상의랑 아우터"를 같이 보는 길이 없다.
    streamHome.mockResolvedValue(feed(['상의', '바지', '아우터']));
    const tree = await mount();

    await press(chip(tree, '상의'));
    await press(chip(tree, '아우터'));
    const shown = texts(tree);

    expect(shown).toContain('상의 아이템 0');
    expect(shown).toContain('아우터 아이템 2');
    expect(shown).not.toContain('바지 아이템 1');
  });

  it('drops a category when it is tapped again', async () => {
    streamHome.mockResolvedValue(feed(['상의', '바지']));
    const tree = await mount();

    await press(chip(tree, '바지'));
    await press(chip(tree, '바지'));

    expect(texts(tree)).toContain('상의 아이템 0');
  });

  it('clears every category with the 전체 chip', async () => {
    streamHome.mockResolvedValue(feed(['상의', '바지']));
    const tree = await mount();

    await press(chip(tree, '바지'));
    await press(chip(tree, '전체'));

    expect(texts(tree)).toContain('상의 아이템 0');
  });

  it('shows how many tiles each category holds', async () => {
    // 눌러 보기 전에 결과를 알 수 없으면 빈 화면을 만나야만 알게 된다.
    streamHome.mockResolvedValue(feed(['바지', '바지', '상의']));
    const tree = await mount();

    expect(chip(tree, '바지').props.count).toBe(2);
    expect(chip(tree, '상의').props.count).toBe(1);
  });

  it('blocks a category this feed has nothing for', async () => {
    streamHome.mockResolvedValue(feed(['상의']));
    const tree = await mount();

    expect(chip(tree, '모자').props.disabled).toBe(true);
    expect(chip(tree, '상의').props.disabled).toBe(false);
  });

  it('drops a chosen category the new feed no longer carries', async () => {
    // 고른 채로 두면 검색 결과가 도착해도 타일이 하나도 없는 화면이 된다.
    streamHome.mockResolvedValue(feed(['상의', '모자']));
    const tree = await mount();
    await press(chip(tree, '모자'));

    streamHome.mockResolvedValue(feed(['상의', '바지']));
    await type(tree, '청바지');
    await submit(tree);

    expect(texts(tree)).toContain('상의 아이템 0');
  });

  it('offers every category the catalog actually has', async () => {
    // 백엔드 _HOME_CATEGORIES에 있는데 칩이 없으면 그 옷은 걸러 볼 수 없다.
    const tree = await mount();

    expect(() => chip(tree, '원피스/스커트')).not.toThrow();
  });

  it('sends the typed request on submit', async () => {
    const tree = await mount();

    await type(tree, '검정 미니멀');
    await submit(tree);

    expect(lastParams()).toMatchObject({ prompt: '검정 미니멀' });
  });
});

describe('HomeScreen cache', () => {
  it('keeps a separate cache per condition', async () => {
    // 하나의 키를 쓰면 검색 결과가 기본 피드 자리에 저장돼 되살아난다.
    const tree = await mount();
    const defaultKey = cacheWrite.mock.calls[0][0];

    await type(tree, '청바지');
    await submit(tree);
    const searchKey = cacheWrite.mock.calls[cacheWrite.mock.calls.length - 1][0];

    expect(searchKey).not.toBe(defaultKey);
  });

  it('serves a cached condition without calling the agent again', async () => {
    const tree = await mount();
    cacheRead.mockResolvedValue({
      products: [{ id: 'cached', brand: 'b', name: 'n', category: '바지', price: 'p', tags: [], imageTone: '#fff' }],
      applied: null,
      message: '',
    });
    const before = streamHome.mock.calls.length;

    await type(tree, '청바지');
    await submit(tree);

    expect(streamHome.mock.calls.length).toBe(before);
  });

  it('restores the conditions and summary along with the tiles', async () => {
    // 타일만 복원하면 "적용된 조건"과 AI 한마디가 직전 조건의 것으로 남는다.
    const tree = await mount();
    cacheRead.mockResolvedValue({
      products: [{ id: 'cached', brand: 'b', name: 'n', category: '바지', price: 'p', tags: [], imageTone: '#fff' }],
      applied: {
        category: null,
        mood: null,
        season: null,
        ageRange: '30대',
        preferredStyles: [],
        prompt: '',
        resultCount: 1,
      },
      message: '캐시에 담긴 한마디',
    });

    await type(tree, '청바지');
    await submit(tree);
    const shown = texts(tree);

    expect(shown).toContain('30대');
    expect(shown).toContain('캐시에 담긴 한마디');
  });
});

describe('HomeScreen refresh', () => {
  it('fetches a new set when the refresh button is pressed', async () => {
    const tree = await mount();

    await press(byLabel(tree, '새 추천 받기'));

    expect(streamHome).toHaveBeenCalledTimes(2);
  });

  it('varies the refresh seed so the same tiles do not come back', async () => {
    const tree = await mount();

    await press(byLabel(tree, '새 추천 받기'));

    expect(lastParams().refreshSeed).not.toBe(0);
  });

  it('stops refreshing once the per-session limit is reached', async () => {
    // 새 추천 한 번이 Gemini 호출 한 번이다. 연타로 비용이 새지 않게 막는다.
    const tree = await mount();

    for (let attempt = 0; attempt < 8; attempt += 1) {
      await press(byLabel(tree, '새 추천 받기'));
    }

    expect(streamHome).toHaveBeenCalledTimes(1 + 5);
  });

  it('does not spend the refresh budget on searching', async () => {
    // 검색·필터는 사용자가 명시적으로 요청한 것이라 새로고침과 성격이 다르다.
    const tree = await mount();

    for (let attempt = 0; attempt < 8; attempt += 1) {
      await press(byLabel(tree, '새 추천 받기'));
    }
    const exhausted = streamHome.mock.calls.length;
    await type(tree, '청바지');
    await submit(tree);

    expect(streamHome.mock.calls.length).toBe(exhausted + 1);
  });
});

describe('HomeScreen result grounding', () => {
  it('shows the conditions that produced the results', async () => {
    // 무엇으로 찾았는지 보이지 않으면 결과가 왜 이런지 알 수 없다.
    const tree = await mount();
    const shown = texts(tree);

    expect(shown).toContain('20대');
    expect(shown).toContain('스트릿');
  });

  it("shows the AI's own summary", async () => {
    const tree = await mount();

    expect(texts(tree)).toContain('오늘은 미니멀하게');
  });

  it('lets the user drop a category filter from the summary', async () => {
    streamHome.mockResolvedValue(feed(['상의', '바지']));
    const tree = await mount();
    await press(chip(tree, '바지'));
    const before = streamHome.mock.calls.length;

    await press(byLabel(tree, '카테고리 바지 해제'));

    expect(texts(tree)).toContain('상의 아이템 0');
    // 해제도 로컬이다. 조건을 뺐다고 에이전트를 다시 부를 이유가 없다.
    expect(streamHome.mock.calls.length).toBe(before);
  });

  it('counts what is on screen, not what the server returned', async () => {
    // 서버가 준 개수를 그대로 쓰면 칩을 눌러도 숫자가 그대로라 필터가
    // 걸리지 않은 것처럼 읽힌다.
    streamHome.mockResolvedValue(feed(['상의', '바지', '바지']));
    const tree = await mount();

    await press(chip(tree, '바지'));

    expect(texts(tree)).toContain('2');
  });
});

describe('HomeScreen failure handling', () => {
  it('falls back to the plain request when streaming is unavailable', async () => {
    streamHome.mockRejectedValue(new Error('streaming is not supported here'));

    await mount();

    expect(requestHome).toHaveBeenCalled();
  });

  it('explains a timeout differently from a server error', async () => {
    streamHome.mockRejectedValue(new Error('timeout of 60000ms exceeded'));
    requestHome.mockRejectedValue(new Error('timeout of 60000ms exceeded'));

    const tree = await mount();

    expect(texts(tree).some((text) => text.includes('시간이 너무 오래'))).toBe(true);
  });

  it('explains a server error', async () => {
    streamHome.mockRejectedValue({ status: 500, message: 'boom' });
    requestHome.mockRejectedValue({ status: 500, message: 'boom' });

    const tree = await mount();

    expect(texts(tree).some((text) => text.includes('서버에 문제'))).toBe(true);
  });

  it('suggests dropping a condition when a narrowed search finds nothing', async () => {
    const tree = await mount();
    streamHome.mockResolvedValue(
      recommendation({
        items: [],
        appliedFilters: {
          category: null,
          mood: null,
          season: null,
          ageRange: null,
          preferredStyles: [],
          prompt: '청바지',
          resultCount: 0,
        },
      }),
    );

    await type(tree, '청바지');
    await submit(tree);

    expect(texts(tree).some((text) => text.includes('조건을 하나 빼고'))).toBe(true);
  });
});

describe('HomeScreen progress', () => {
  /** 진행 표시는 결과가 도착하면 사라진다. 도착 전 화면을 보려면 붙잡아야 한다. */
  function streamPending(steps: AgentProgressStep[]): (value: Recommendation) => void {
    let release: (value: Recommendation) => void = () => {};
    streamHome.mockImplementation((_params, onStep) => {
      steps.forEach(onStep);
      return new Promise<Recommendation>((resolve) => {
        release = resolve;
      });
    });
    return (value) => release(value);
  }

  it('shows the steps the agent reports', async () => {
    const release = streamPending([
      { node: 'musinsa_rag', label: '상품에서 골랐어요', detail: '후보 30건' },
    ]);

    const tree = await mount();
    const shown = texts(tree);
    await renderer.act(async () => {
      release(recommendation());
    });

    expect(shown).toContain('상품에서 골랐어요');
    expect(shown).toContain('후보 30건');
  });

  it('stacks steps in the order they arrive', async () => {
    const release = streamPending([
      { node: 'intent_classifier', label: '무엇을 찾는지 파악했어요', detail: null },
      { node: 'musinsa_rag', label: '상품에서 골랐어요', detail: '후보 30건' },
    ]);

    const tree = await mount();
    const shown = texts(tree);
    await renderer.act(async () => {
      release(recommendation());
    });

    expect(shown.indexOf('무엇을 찾는지 파악했어요')).toBeLessThan(shown.indexOf('상품에서 골랐어요'));
  });

  it('hides progress once the results arrive', async () => {
    const release = streamPending([
      { node: 'musinsa_rag', label: '상품에서 골랐어요', detail: '후보 30건' },
    ]);
    const tree = await mount();

    await renderer.act(async () => {
      release(recommendation());
    });
    await settle();

    expect(texts(tree)).not.toContain('상품에서 골랐어요');
  });

  it('shows progress while searching, not just on first load', async () => {
    // 검색 중에는 이전 타일이 남아 목록이 비지 않는다. 진행 표시를
    // ListEmptyComponent에 두면 이 경로에서만 아무것도 보이지 않는다.
    const tree = await mount();
    const release = streamPending([
      { node: 'musinsa_rag', label: '상품에서 골랐어요', detail: '후보 30건' },
    ]);

    await type(tree, '청바지');
    await submit(tree);
    const shown = texts(tree);
    await renderer.act(async () => {
      release(recommendation());
    });

    expect(shown).toContain('상품에서 골랐어요');
  });

  it('does not make the user wait for a category chip', async () => {
    // 칩이 로딩을 띄우면 필터가 아니라 또 하나의 요청으로 읽힌다.
    streamHome.mockResolvedValue(feed(['상의', '바지']));
    const tree = await mount();

    await press(chip(tree, '바지'));

    expect(texts(tree)).toContain('바지 아이템 1');
  });

  it('drops stale tiles when the conditions change', async () => {
    // 새 조건과 맞지 않는 타일이 그대로 보이면 검색이 안 된 것처럼 읽힌다.
    const tree = await mount();
    expect(texts(tree)).toContain('와이드 슬랙스');
    const release = streamPending([]);

    await type(tree, '청바지');
    await submit(tree);
    const shown = texts(tree);
    await renderer.act(async () => {
      release(recommendation());
    });

    expect(shown).not.toContain('와이드 슬랙스');
  });

  it('keeps the current tiles while refreshing the same conditions', async () => {
    // 같은 조건이라 화면을 비울 이유가 없다. 비우면 깜빡인다.
    const tree = await mount();
    const release = streamPending([]);

    await press(byLabel(tree, '새 추천 받기'));
    const shown = texts(tree);
    await renderer.act(async () => {
      release(recommendation());
    });

    expect(shown).toContain('와이드 슬랙스');
  });

  it('marks estimated progress so it is not mistaken for real progress', async () => {
    streamHome.mockRejectedValue(new Error('streaming is not supported here'));
    let release: (value: Recommendation) => void = () => {};
    requestHome.mockImplementation(
      () => new Promise<Recommendation>((resolve) => {
        release = resolve;
      }),
    );

    const tree = await mount();
    const shown = texts(tree);
    await renderer.act(async () => {
      release(recommendation());
    });

    expect(shown).toContain('예상');
  });
});
