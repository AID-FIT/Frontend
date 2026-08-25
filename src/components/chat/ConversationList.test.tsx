import { Text } from 'react-native';
import renderer, { type ReactTestInstance } from 'react-test-renderer';
import { ConversationList } from './ConversationList';

// 아이콘 폰트 로더는 jest 환경에서 해석되지 않고, 이 테스트의 관심사도 아니다.
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

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

function queryByLabel(
  tree: renderer.ReactTestRenderer,
  label: string,
): ReactTestInstance | undefined {
  return tree.root.findAll((node) => node.props.accessibilityLabel === label)[0];
}

function textOf(node: ReactTestInstance): string {
  const { children } = node.props;
  // 보간이 섞인 <Text>는 children이 배열로 온다.
  return (Array.isArray(children) ? children : [children]).join('');
}

function hasText(tree: renderer.ReactTestRenderer, value: string): boolean {
  return tree.root.findAllByType(Text).some((node) => textOf(node) === value);
}

const conversations = [
  { id: 'c1', title: '겨울 코디', created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  { id: 'c2', title: '면접 룩', created_at: '2026-08-02T00:00:00Z', updated_at: '2026-08-02T00:00:00Z' },
];

function baseProps() {
  return {
    conversations,
    activeId: 'c1',
    onSelect: jest.fn(),
    onNewConversation: jest.fn(),
    onDelete: jest.fn(),
    onDeleteAll: jest.fn(),
  };
}

describe('ConversationList delete', () => {
  it('does not delete on the first press', () => {
    // 되돌릴 수 없는 동작이라 한 번 더 확인받는다.
    const props = baseProps();
    const tree = render(<ConversationList {...props} />);

    press(findByLabel(tree, '대화 삭제: 겨울 코디'));

    expect(props.onDelete).not.toHaveBeenCalled();
    expect(hasText(tree, '삭제할까요?')).toBe(true);
  });

  it('deletes once the confirmation is pressed', () => {
    const props = baseProps();
    const tree = render(<ConversationList {...props} />);
    press(findByLabel(tree, '대화 삭제: 겨울 코디'));

    press(findByLabel(tree, '대화 삭제 확인: 겨울 코디'));

    expect(props.onDelete).toHaveBeenCalledWith('c1');
  });

  it('leaves the conversation alone when the confirmation is cancelled', () => {
    const props = baseProps();
    const tree = render(<ConversationList {...props} />);
    press(findByLabel(tree, '대화 삭제: 겨울 코디'));

    press(findByLabel(tree, '대화 삭제 취소'));

    expect(props.onDelete).not.toHaveBeenCalled();
    expect(hasText(tree, '삭제할까요?')).toBe(false);
  });

  it('confirms only the row that was pressed', () => {
    const props = baseProps();
    const tree = render(<ConversationList {...props} />);

    press(findByLabel(tree, '대화 삭제: 면접 룩'));

    expect(queryByLabel(tree, '대화 삭제 확인: 면접 룩')).toBeDefined();
    expect(queryByLabel(tree, '대화 삭제 확인: 겨울 코디')).toBeUndefined();
  });

  it('shows progress and blocks other rows while a delete is in flight', () => {
    const props = { ...baseProps(), deletingId: 'c1' };
    const tree = render(<ConversationList {...props} />);

    expect(hasText(tree, '삭제 중…')).toBe(true);
    expect(findByLabel(tree, '대화 삭제: 면접 룩').props.disabled).toBe(true);
  });

  it('hides the delete affordance when the screen does not provide a handler', () => {
    const { onDelete, onDeleteAll, ...props } = baseProps();
    const tree = render(<ConversationList {...props} />);

    expect(queryByLabel(tree, '대화 삭제: 겨울 코디')).toBeUndefined();
    expect(queryByLabel(tree, '전체 대화 삭제')).toBeUndefined();
  });
});

describe('ConversationList delete all', () => {
  it('asks before wiping every conversation', () => {
    const props = baseProps();
    const tree = render(<ConversationList {...props} />);

    press(findByLabel(tree, '전체 대화 삭제'));

    expect(props.onDeleteAll).not.toHaveBeenCalled();
    expect(hasText(tree, '대화 2개를 모두 지울까요?')).toBe(true);
  });

  it('wipes them once confirmed', () => {
    const props = baseProps();
    const tree = render(<ConversationList {...props} />);
    press(findByLabel(tree, '전체 대화 삭제'));

    press(findByLabel(tree, '전체 삭제 확인'));

    expect(props.onDeleteAll).toHaveBeenCalledTimes(1);
  });

  it('offers nothing to wipe when the list is empty', () => {
    const props = { ...baseProps(), conversations: [] };
    const tree = render(<ConversationList {...props} />);

    expect(queryByLabel(tree, '전체 대화 삭제')).toBeUndefined();
    expect(hasText(tree, '아직 대화가 없어요.')).toBe(true);
  });
});
