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
    category: '바지',
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

describe('ProductCard image', () => {
  it('shows the whole garment instead of cropping it', () => {
    // cover는 위아래를 잘라 무엇인지 알 수 없게 만든다.
    const tree = render(<ProductCard product={product()} />);

    const image = tree.root.find((node) => node.props.source?.uri === 'https://image.example/item.jpg');
    expect(image.props.resizeMode).toBe('contain');
  });
});

describe('ProductCard reason overflow', () => {
  const long =
    '검은 재킷의 각진 어깨선과 대비되도록 밑단이 넓은 슬랙스를 골랐습니다. 톤을 낮춘 회색이라 상의가 강해도 부딪히지 않습니다.';

  // 상품명에도 numberOfLines={2}가 걸려 있다. onLayout이 붙은 쪽이 추천 이유다.
  function reasonParagraph(tree: renderer.ReactTestRenderer): ReactTestInstance {
    return tree.root.findAll(
      (node) => node.props.numberOfLines === 2 && typeof node.props.onLayout === 'function',
    )[0];
  }

  it('lets a long reason be opened in full', () => {
    const tree = render(<ProductCard product={product({ reason: long })} />);
    const hidden = tree.root.findAll((node) => node.props['aria-hidden'])[0];

    renderer.act(() => {
      reasonParagraph(tree).props.onLayout({ nativeEvent: { layout: { height: 34 } } });
      hidden.props.onLayout({ nativeEvent: { layout: { height: 68 } } });
    });

    const link = tree.root.find((node) => node.props.accessibilityLabel === '추천 이유 전체 보기');
    renderer.act(() => link.props.onPress());

    expect(textsOf(tree)).toContain('접기');
  });

  it('leaves a short reason alone', () => {
    const tree = render(<ProductCard product={product({ reason: '색이 잘 맞아요.' })} />);
    const paragraph = reasonParagraph(tree);
    const hidden = tree.root.findAll((node) => node.props['aria-hidden'])[0];

    renderer.act(() => {
      paragraph.props.onLayout({ nativeEvent: { layout: { height: 17 } } });
      hidden.props.onLayout({ nativeEvent: { layout: { height: 17 } } });
    });

    expect(textsOf(tree)).not.toContain('더보기');
  });
});
