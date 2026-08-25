import { Text } from 'react-native';
import renderer, { type ReactTestInstance } from 'react-test-renderer';
import { ChatComposer } from './ChatComposer';

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

function press(node: ReactTestInstance) {
  renderer.act(() => {
    node.props.onPress();
  });
}

function findByLabel(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  return tree.root.find((node) => node.props.accessibilityLabel === label);
}

function hasText(tree: renderer.ReactTestRenderer, value: string): boolean {
  return tree.root
    .findAllByType(Text)
    .some((node) => String(node.props.children) === value);
}

function baseProps() {
  return {
    value: '',
    attachments: [],
    canSend: false,
    isSending: false,
    isUploading: false,
    canStartNewConversation: true,
    onChangeText: jest.fn(),
    onAttach: jest.fn(),
    onNewConversation: jest.fn(),
    onRemoveAttachment: jest.fn(),
    onSend: jest.fn(),
  };
}

describe('ChatComposer attach menu', () => {
  it('keeps the menu closed until the attach button is pressed', () => {
    const tree = render(<ChatComposer {...baseProps()} />);

    expect(hasText(tree, '사진 선택하기')).toBe(false);
  });

  it('opens the menu when the attach button is pressed', () => {
    const tree = render(<ChatComposer {...baseProps()} />);

    press(findByLabel(tree, '사진 첨부'));

    expect(hasText(tree, '사진 선택하기')).toBe(true);
  });

  it('does not open the picker until the menu item is chosen', () => {
    const props = baseProps();
    const tree = render(<ChatComposer {...props} />);

    press(findByLabel(tree, '사진 첨부'));

    expect(props.onAttach).not.toHaveBeenCalled();
  });

  it('opens the picker and closes the menu when the item is chosen', () => {
    const props = baseProps();
    const tree = render(<ChatComposer {...props} />);
    press(findByLabel(tree, '사진 첨부'));

    press(findByLabel(tree, '사진 선택하기'));

    expect(props.onAttach).toHaveBeenCalledTimes(1);
    expect(hasText(tree, '사진 선택하기')).toBe(false);
  });

  it('closes the menu when the backdrop is pressed', () => {
    const tree = render(<ChatComposer {...baseProps()} />);
    press(findByLabel(tree, '사진 첨부'));

    press(findByLabel(tree, '첨부 메뉴 닫기'));

    expect(hasText(tree, '사진 선택하기')).toBe(false);
  });

  it('starts a new conversation and closes the menu', () => {
    const props = baseProps();
    const tree = render(<ChatComposer {...props} />);
    press(findByLabel(tree, '사진 첨부'));

    press(findByLabel(tree, '새 대화 시작'));

    expect(props.onNewConversation).toHaveBeenCalledTimes(1);
    expect(hasText(tree, '새 대화 시작')).toBe(false);
  });

  it('disables starting a new conversation when the current one is already empty', () => {
    // 빈 대화에서 또 시작하면 쓰이지 않는 대화만 쌓인다.
    const props = { ...baseProps(), canStartNewConversation: false };
    const tree = render(<ChatComposer {...props} />);
    press(findByLabel(tree, '사진 첨부'));

    expect(findByLabel(tree, '새 대화 시작').props.disabled).toBe(true);
  });
});

describe('ChatComposer closet selection', () => {
  const closetItem = {
    id: 'c1',
    image_id: 'image-c1',
    name: '검은 재킷',
    brand: null,
    price: null,
    category: '아우터',
    sub_category: null,
    gender: null,
    image_url: 'https://cdn.aidfit.com/c1.jpg',
    product_url: null,
    color: null,
    material: null,
    fit: null,
    pattern: null,
    mood: null,
    sense_of_season: null,
    is_match: true,
  };

  it('offers the closet next to the photo picker', () => {
    const tree = render(<ChatComposer {...baseProps()} onPickFromCloset={jest.fn()} />);

    press(findByLabel(tree, '사진 첨부'));

    expect(hasText(tree, '옷장에서 가져오기')).toBe(true);
  });

  it('opens the closet picker and closes the menu', () => {
    const onPickFromCloset = jest.fn();
    const tree = render(<ChatComposer {...baseProps()} onPickFromCloset={onPickFromCloset} />);
    press(findByLabel(tree, '사진 첨부'));

    press(findByLabel(tree, '옷장에서 가져오기'));

    expect(onPickFromCloset).toHaveBeenCalledTimes(1);
    expect(hasText(tree, '옷장에서 가져오기')).toBe(false);
  });

  it('shows nothing above the input until an item is chosen', () => {
    const tree = render(<ChatComposer {...baseProps()} />);

    expect(hasText(tree, '옷장에서 가져온 옷')).toBe(false);
  });

  it('lists the chosen clothes above the input', () => {
    const tree = render(<ChatComposer {...baseProps()} closetSelection={[closetItem]} />);

    expect(hasText(tree, '옷장에서 가져온 옷')).toBe(true);
    expect(hasText(tree, '검은 재킷')).toBe(true);
  });

  it('removes a chosen item by its id', () => {
    const onRemoveClosetItem = jest.fn();
    const tree = render(
      <ChatComposer
        {...baseProps()}
        closetSelection={[closetItem]}
        onRemoveClosetItem={onRemoveClosetItem}
      />,
    );

    press(findByLabel(tree, '옷장 선택 해제: 검은 재킷'));

    expect(onRemoveClosetItem).toHaveBeenCalledWith('c1');
  });
});
