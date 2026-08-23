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
