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
    onChangeText: jest.fn(),
    onAttach: jest.fn(),
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
});
