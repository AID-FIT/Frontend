import { Linking } from 'react-native';
import renderer, { type ReactTestInstance } from 'react-test-renderer';
import { ProductCard } from './ProductCard';
import type { Product } from '../../types/fashion';

// 아이콘 폰트 로더는 jest 환경에서 해석되지 않고, 이 테스트의 관심사도 아니다.
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

// React 19에서는 act로 감싸지 않으면 렌더가 커밋되지 않고 트리가 정리된다.
function render(element: React.ReactElement): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(element);
  });
  return tree;
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'musinsa_1',
    brand: 'Example Brand',
    name: '와이드 슬랙스',
    price: '59,000원',
    tags: ['바지'],
    imageTone: '#f5f7fa',
    imageUrl: 'https://image.example/item.jpg',
    productUrl: 'https://www.musinsa.com/products/1',
    aiRecommended: true,
    ...overrides,
  };
}

function card(tree: renderer.ReactTestRenderer): ReactTestInstance {
  return tree.root.find((node) => node.props.onPress !== undefined && node.props.disabled !== undefined);
}

function textsOf(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((node) => typeof node.type === 'string' && node.children.length > 0)
    .flatMap((node) => node.children)
    .filter((child): child is string => typeof child === 'string');
}

describe('ProductCard reason', () => {
  it('shows why the AI picked this item', () => {
    // 백엔드가 보내 주는 설명을 버리면 사용자는 결과의 근거를 볼 수 없다.
    const tree = render(<ProductCard product={product({ reason: '검정 상의와 잘 어울려요' })} />);

    expect(textsOf(tree)).toContain('검정 상의와 잘 어울려요');
  });

  it('takes no space when there is no reason', () => {
    const tree = render(<ProductCard product={product({ reason: null })} />);

    expect(textsOf(tree)).not.toContain('검정 상의와 잘 어울려요');
  });
});

describe('ProductCard link', () => {
  let openURL: jest.SpyInstance;

  beforeEach(() => {
    // spyOn을 매번 새로 걸어도 react-native-web의 Linking에서는 이전 호출이
    // 남는 경우가 있어 명시적으로 비운다.
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    openURL.mockClear();
  });

  afterEach(() => {
    openURL.mockRestore();
  });

  it('opens the shopping page when pressed', () => {
    const tree = render(<ProductCard product={product()} />);

    renderer.act(() => {
      card(tree).props.onPress();
    });

    expect(Linking.openURL).toHaveBeenCalledWith('https://www.musinsa.com/products/1');
  });

  it('is not pressable without a product url', () => {
    // 링크가 없는 카드가 눌리면 아무 일도 없어 고장난 것처럼 보인다.
    const tree = render(<ProductCard product={product({ productUrl: null })} />);

    expect(card(tree).props.disabled).toBe(true);
  });

  it('does not open anything when the url is missing', () => {
    const tree = render(<ProductCard product={product({ productUrl: null })} />);

    renderer.act(() => {
      card(tree).props.onPress();
    });

    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
