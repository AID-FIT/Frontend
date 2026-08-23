import renderer, { type ReactTestInstance } from 'react-test-renderer';
import { HomeScreen } from './HomeScreen';
import { getHomeRecommendation } from '../../services/recommendationService';
import { writeCache } from '../../utils/cache';
import type { Recommendation } from '../../types/fashion';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../../services/recommendationService', () => ({
  getHomeRecommendation: jest.fn(),
}));
jest.mock('../../utils/cache', () => ({
  readCache: jest.fn().mockResolvedValue(null),
  writeCache: jest.fn().mockResolvedValue(undefined),
}));

const requestHome = getHomeRecommendation as jest.MockedFunction<typeof getHomeRecommendation>;
const cacheWrite = writeCache as jest.MockedFunction<typeof writeCache>;

const recommendation: Recommendation = {
  id: 'rec_1',
  message: '추천이에요',
  items: [
    {
      id: 'item_1',
      name: '와이드 슬랙스',
      category: '바지',
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
} as unknown as Recommendation;

// 렌더 후 진행 중인 프로미스와 타이머를 모두 흘려보낸다. 홈은 캐시 조회와
// 요청이 모두 비동기고, FlatList도 setTimeout으로 셀을 갱신한다. act 한 번으로는
// 상태가 정착하지 않고, 남은 타이머가 act 밖에서 터져 경고를 낸다.
async function settle(tree: renderer.ReactTestRenderer): Promise<void> {
  await renderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    jest.runOnlyPendingTimers();
  });
  void tree;
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<HomeScreen />);
  });
  await settle(tree);
  return tree;
}

function chip(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  return tree.root.find(
    (node) => node.props.label === label && typeof node.props.onPress === 'function',
  );
}

function searchInput(tree: renderer.ReactTestRenderer): ReactTestInstance {
  return tree.root.find((node) => typeof node.props.onSubmitEditing === 'function');
}

async function press(tree: renderer.ReactTestRenderer, node: ReactTestInstance): Promise<void> {
  await renderer.act(async () => {
    node.props.onPress();
  });
  await settle(tree);
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
  await settle(tree);
}

function lastPrompt(): string {
  return requestHome.mock.calls[requestHome.mock.calls.length - 1][0] as string;
}

describe('HomeScreen search', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    requestHome.mockReset();
    requestHome.mockResolvedValue(recommendation);
    cacheWrite.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('asks for taste-based recommendations on first load', async () => {
    await mount();

    expect(lastPrompt()).toBe('');
  });

  it('sends the typed request', async () => {
    const tree = await mount();

    await type(tree, '바지');
    await submit(tree);

    expect(lastPrompt()).toBe('바지');
  });

  it('keeps the typed request when a mood chip is tapped', async () => {
    // 칩이 입력창을 덮어쓰면 방금 적은 요청이 조용히 사라진다.
    const tree = await mount();

    await type(tree, '바지');
    await press(tree, chip(tree, '여름'));

    expect(lastPrompt()).toBe('여름 바지');
  });

  it('clears the mood when the same chip is tapped again', async () => {
    const tree = await mount();

    await press(tree, chip(tree, '여름'));
    await press(tree, chip(tree, '여름'));

    expect(lastPrompt()).toBe('');
  });

  it('does not cache a search result as the default home feed', async () => {
    // 같은 키에 쓰면 다음 진입에서 검색어 없이도 그 결과가 되살아난다.
    const tree = await mount();
    cacheWrite.mockClear();

    await type(tree, '바지');
    await submit(tree);

    expect(cacheWrite).not.toHaveBeenCalled();
  });

  it('caches the default recommendation', async () => {
    await mount();

    expect(cacheWrite).toHaveBeenCalled();
  });
});
