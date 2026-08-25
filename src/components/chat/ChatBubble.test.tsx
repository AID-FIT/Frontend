import { Image, Text } from 'react-native';
import renderer, { type ReactTestInstance } from 'react-test-renderer';

// 아이콘 폰트 로더는 jest 환경에서 해석되지 않고, 이 테스트의 관심사도 아니다.
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

import { ChatBubble } from './ChatBubble';
import { ChatRecommendationList } from './ChatRecommendationList';
import type { AgentRecommendationItem } from '../../services/recommendationService';

// React 19에서는 act로 감싸지 않으면 렌더가 커밋되지 않고 트리가 정리된다.
function render(element: React.ReactElement): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(element);
  });
  return tree;
}

function textContent(instance: ReactTestInstance): string[] {
  return instance.findAllByType(Text).flatMap((node) =>
    node.props.children === undefined ? [] : [String(node.props.children)],
  );
}

function item(overrides: Partial<AgentRecommendationItem> = {}): AgentRecommendationItem {
  return {
    item_id: 'musinsa_1',
    source: 'musinsa',
    item_name: '세미 와이드 데님 팬츠',
    brand: 'Example Brand',
    category: 'pants',
    image_url: 'https://image.example/item.jpg',
    product_url: 'https://www.musinsa.com/products/1',
    price: 59000,
    reason: '재킷의 무드와 잘 이어집니다.',
    ...overrides,
  };
}

describe('ChatBubble', () => {
  it('renders the message text', () => {
    const tree = render(<ChatBubble role="user" content="검은색 재킷 추천해줘" />);

    expect(textContent(tree.root)).toContain('검은색 재킷 추천해줘');
  });

  it('renders attached images', () => {
    const tree = render(
      <ChatBubble
        role="user"
        content="이 옷에 어울리는 바지"
        imageUrls={['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']}
      />,
    );

    const sources = tree.root.findAllByType(Image).map((node) => node.props.source.uri);
    expect(sources).toEqual(['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']);
  });

  it('renders without crashing when content is empty', () => {
    const tree = render(<ChatBubble role="assistant" content="" />);

    expect(tree.root.findAllByType(Text)).toHaveLength(0);
  });

  it('replays the clothes that were taken from the closet', () => {
    const tree = render(
      <ChatBubble
        role="user"
        content="이 재킷에 어울리는 바지"
        closetItems={[
          {
            closet_item_id: 'c1',
            name: '검은 재킷',
            image_url: 'https://cdn.example/c1.jpg',
            category: '아우터',
          },
        ]}
      />,
    );

    expect(textContent(tree.root)).toContain('옷장에서 가져온 옷');
    expect(tree.root.findAllByType(Image).map((node) => node.props.source.uri)).toEqual([
      'https://cdn.example/c1.jpg',
    ]);
  });

  it('keeps the bubble intact when the closet item was deleted since', () => {
    // 스냅샷은 남지만 이미지가 사라졌을 수 있다. 말풍선까지 무너지면 안 된다.
    const tree = render(
      <ChatBubble
        role="user"
        content="이 재킷에 어울리는 바지"
        closetItems={[
          { closet_item_id: 'c1', name: '검은 재킷', image_url: null, category: null },
        ]}
      />,
    );

    expect(textContent(tree.root)).toContain('옷장에서 가져온 옷');
    expect(tree.root.findAllByType(Image)).toHaveLength(1);
  });

  it('shows no closet row on a plain message', () => {
    const tree = render(<ChatBubble role="user" content="추천해줘" />);

    expect(textContent(tree.root)).not.toContain('옷장에서 가져온 옷');
  });
});

describe('ChatRecommendationList', () => {
  it('renders product name, brand and formatted price', () => {
    const tree = render(<ChatRecommendationList items={[item()]} />);
    const texts = textContent(tree.root);

    expect(texts).toContain('세미 와이드 데님 팬츠');
    expect(texts).toContain('Example Brand');
    expect(texts).toContain('59,000원');
  });

  it('shows a placeholder label when price is missing', () => {
    const tree = render(<ChatRecommendationList items={[item({ price: null })]} />);

    expect(textContent(tree.root)).toContain('가격 미정');
  });

  it('renders style guide tips', () => {
    const tree = render(
      <ChatRecommendationList items={[]} tips={['밝은 상의에는 진청 하의가 안정적입니다.']} />,
    );

    expect(textContent(tree.root)).toContain('밝은 상의에는 진청 하의가 안정적입니다.');
  });

  it('renders nothing when there are no items and no tips', () => {
    const tree = render(<ChatRecommendationList items={[]} />);

    expect(tree.toJSON()).toBeNull();
  });
});

describe('ChatRecommendationList card', () => {
  it('shows the whole garment instead of cropping it', () => {
    const tree = render(<ChatRecommendationList items={[item()]} />);

    const image = tree.root.find((node) => node.props.source?.uri === 'https://image.example/item.jpg');
    expect(image.props.resizeMode).toBe('contain');
  });

  it('lets a long reason be opened in full', () => {
    const long =
      '검은 재킷의 각진 어깨선과 대비되도록 밑단이 넓은 슬랙스를 골랐습니다. 톤을 낮춘 회색이라 상의가 강해도 부딪히지 않습니다.';
    const tree = render(<ChatRecommendationList items={[item({ reason: long })]} />);
    const paragraph = tree.root.findAll(
      (node) => node.props.numberOfLines === 3 && typeof node.props.onLayout === 'function',
    )[0];
    const hidden = tree.root.findAll((node) => node.props['aria-hidden'])[0];

    renderer.act(() => {
      paragraph.props.onLayout({ nativeEvent: { layout: { height: 48 } } });
      hidden.props.onLayout({ nativeEvent: { layout: { height: 96 } } });
    });

    expect(textContent(tree.root)).toContain('더보기');
  });

  it('leaves a short reason alone', () => {
    const tree = render(<ChatRecommendationList items={[item({ reason: '색이 잘 맞아요.' })]} />);
    const paragraph = tree.root.findAll(
      (node) => node.props.numberOfLines === 3 && typeof node.props.onLayout === 'function',
    )[0];
    const hidden = tree.root.findAll((node) => node.props['aria-hidden'])[0];

    renderer.act(() => {
      paragraph.props.onLayout({ nativeEvent: { layout: { height: 16 } } });
      hidden.props.onLayout({ nativeEvent: { layout: { height: 16 } } });
    });

    expect(textContent(tree.root)).not.toContain('더보기');
  });
});
