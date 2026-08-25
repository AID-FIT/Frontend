import { Text } from 'react-native';
import renderer, { type ReactTestInstance } from 'react-test-renderer';
import { ClosetPickerSheet } from './ClosetPickerSheet';
import type { ClosetItem } from '../../services/closetService';

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

function textOf(node: ReactTestInstance): string {
  const { children } = node.props;
  return (Array.isArray(children) ? children : [children]).join('');
}

function hasText(tree: renderer.ReactTestRenderer, value: string): boolean {
  return tree.root.findAllByType(Text).some((node) => textOf(node) === value);
}

function closetItem(id: string, name: string): ClosetItem {
  return {
    id,
    image_id: `image-${id}`,
    name,
    brand: null,
    price: null,
    category: '상의',
    sub_category: null,
    gender: null,
    image_url: `https://cdn.aidfit.com/${id}.jpg`,
    product_url: null,
    color: null,
    material: null,
    fit: null,
    pattern: null,
    mood: null,
    sense_of_season: null,
    is_match: true,
  };
}

const items = [closetItem('c1', '검은 재킷'), closetItem('c2', '흰 셔츠'), closetItem('c3', '와이드 팬츠')];

function baseProps() {
  return {
    items,
    initialSelectedIds: [] as string[],
    maxSelection: 2,
    isLoading: false,
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
  };
}

describe('ClosetPickerSheet', () => {
  it('confirms nothing when nothing was chosen', () => {
    const props = baseProps();
    const tree = render(<ClosetPickerSheet {...props} />);

    press(findByLabel(tree, '옷장 선택 완료'));

    expect(props.onConfirm).toHaveBeenCalledWith([]);
  });

  it('hands back the items that were chosen', () => {
    const props = baseProps();
    const tree = render(<ClosetPickerSheet {...props} />);

    press(findByLabel(tree, '옷장 아이템 선택: 검은 재킷'));
    press(findByLabel(tree, '옷장 선택 완료'));

    expect(props.onConfirm).toHaveBeenCalledWith([items[0]]);
  });

  it('keeps the order they were picked in', () => {
    // 순서가 곧 사용자가 말한 우선순위다.
    const props = baseProps();
    const tree = render(<ClosetPickerSheet {...props} />);

    press(findByLabel(tree, '옷장 아이템 선택: 흰 셔츠'));
    press(findByLabel(tree, '옷장 아이템 선택: 검은 재킷'));
    press(findByLabel(tree, '옷장 선택 완료'));

    expect(props.onConfirm).toHaveBeenCalledWith([items[1], items[0]]);
  });

  it('unpicks an item that is pressed again', () => {
    const props = baseProps();
    const tree = render(<ClosetPickerSheet {...props} />);

    press(findByLabel(tree, '옷장 아이템 선택: 검은 재킷'));
    press(findByLabel(tree, '옷장 아이템 선택: 검은 재킷'));
    press(findByLabel(tree, '옷장 선택 완료'));

    expect(props.onConfirm).toHaveBeenCalledWith([]);
  });

  it('stops at the cap instead of silently trimming', () => {
    const props = baseProps();
    const tree = render(<ClosetPickerSheet {...props} />);

    press(findByLabel(tree, '옷장 아이템 선택: 검은 재킷'));
    press(findByLabel(tree, '옷장 아이템 선택: 흰 셔츠'));

    expect(findByLabel(tree, '옷장 아이템 선택: 와이드 팬츠').props.disabled).toBe(true);
    expect(hasText(tree, '2 / 2')).toBe(true);
  });

  it('starts from what is already attached to the message', () => {
    const props = { ...baseProps(), initialSelectedIds: ['c2'] };
    const tree = render(<ClosetPickerSheet {...props} />);

    press(findByLabel(tree, '옷장 선택 완료'));

    expect(props.onConfirm).toHaveBeenCalledWith([items[1]]);
  });

  it('discards the edits when cancelled', () => {
    const props = baseProps();
    const tree = render(<ClosetPickerSheet {...props} />);
    press(findByLabel(tree, '옷장 아이템 선택: 검은 재킷'));

    press(findByLabel(tree, '옷장 선택 취소'));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it('says so when the closet is empty', () => {
    const props = { ...baseProps(), items: [] };
    const tree = render(<ClosetPickerSheet {...props} />);

    expect(hasText(tree, '옷장이 비어 있어요.')).toBe(true);
  });

  it('surfaces a load failure instead of pretending the closet is empty', () => {
    const props = { ...baseProps(), items: [], error: '옷장을 불러오지 못했어요.' };
    const tree = render(<ClosetPickerSheet {...props} />);

    expect(hasText(tree, '옷장을 불러오지 못했어요.')).toBe(true);
    expect(hasText(tree, '옷장이 비어 있어요.')).toBe(false);
  });
});
