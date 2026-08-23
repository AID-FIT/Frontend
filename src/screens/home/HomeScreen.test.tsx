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

    expect(lastParams()).toMatchObject({ prompt: '', category: '' });
  });

  it('sends a category chip as a real filter, not as search text', async () => {
    // 검색어에 문자열로 합쳐 보내면 벡터 유사도에 묻힌다.
    const tree = await mount();

    await press(chip(tree, '바지'));

    expect(lastParams()).toMatchObject({ category: '바지', prompt: '' });
  });

  it('sends no category for the 전체 chip', async () => {
    const tree = await mount();

    await press(chip(tree, '바지'));
    await press(chip(tree, '전체'));

    expect(lastParams()).toMatchObject({ category: '' });
  });

  it('keeps the typed request when a category chip is tapped', async () => {
    const tree = await mount();

    await type(tree, '청바지');
    await press(chip(tree, '바지'));

    expect(lastParams()).toMatchObject({ category: '바지', prompt: '청바지' });
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

    await press(chip(tree, '바지'));
    const categoryKey = cacheWrite.mock.calls[cacheWrite.mock.calls.length - 1][0];

    expect(categoryKey).not.toBe(defaultKey);
  });

  it('serves a cached condition without calling the agent again', async () => {
    const tree = await mount();
    cacheRead.mockResolvedValue({
      products: [{ id: 'cached', brand: 'b', name: 'n', price: 'p', tags: [], imageTone: '#fff' }],
      applied: null,
      message: '',
    });
    const before = streamHome.mock.calls.length;

    await press(chip(tree, '바지'));

    expect(streamHome.mock.calls.length).toBe(before);
  });

  it('restores the conditions and summary along with the tiles', async () => {
    // 타일만 복원하면 "적용된 조건"과 AI 한마디가 직전 조건의 것으로 남는다.
    const tree = await mount();
    cacheRead.mockResolvedValue({
      products: [{ id: 'cached', brand: 'b', name: 'n', price: 'p', tags: [], imageTone: '#fff' }],
      applied: {
        category: '바지',
        mood: null,
        season: null,
        ageRange: '30대',
        preferredStyles: [],
        prompt: '',
        resultCount: 1,
      },
      message: '캐시에 담긴 한마디',
    });

    await press(chip(tree, '바지'));
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
    await press(chip(tree, '바지'));

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
    const tree = await mount();
    streamHome.mockResolvedValue(
      recommendation({
        appliedFilters: {
          category: '바지',
          mood: null,
          season: null,
          ageRange: '20대',
          preferredStyles: [],
          prompt: '',
          resultCount: 1,
        },
      }),
    );
    await press(chip(tree, '바지'));

    await press(byLabel(tree, '카테고리 바지 해제'));

    expect(lastParams()).toMatchObject({ category: '' });
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
          category: '바지',
          mood: null,
          season: null,
          ageRange: null,
          preferredStyles: [],
          prompt: '',
          resultCount: 0,
        },
      }),
    );

    await press(chip(tree, '바지'));

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
