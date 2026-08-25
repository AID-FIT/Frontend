import { Text } from 'react-native';
import renderer, { type ReactTestInstance } from 'react-test-renderer';
import { ProfileScreen } from './ProfileScreen';
import { getMyProfile, updateMyPreferences, type UserProfileResponse } from '../../services/userService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../../services/userService', () => ({
  getMyProfile: jest.fn(),
  updateMyPreferences: jest.fn(),
  profileToAuthUser: jest.fn(() => ({ id: 'u1', email: null, nickname: '태훈', provider: 'social', role: 'user' })),
}));
jest.mock('../../store/useAppStore', () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({ resetSession: jest.fn(), syncUser: jest.fn(), user: null }),
}));

const loadProfile = getMyProfile as jest.MockedFunction<typeof getMyProfile>;
const savePreferences = updateMyPreferences as jest.MockedFunction<typeof updateMyPreferences>;

function profile(overrides: Partial<UserProfileResponse> = {}): UserProfileResponse {
  return {
    id: 'u1',
    email: null,
    nickname: '태훈',
    role: 'user',
    age_range: '20대',
    gender: 'men',
    height_cm: 178,
    styles: ['미니멀'],
    preferred_colors: [],
    avoid_items: [],
    sizes: {},
    ...overrides,
  };
}

async function settle(): Promise<void> {
  await renderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<ProfileScreen />);
  });
  await settle();
  return tree;
}

async function press(node: ReactTestInstance): Promise<void> {
  await renderer.act(async () => {
    node.props.onPress();
  });
  await settle();
}

function chip(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  return tree.root.find(
    (node) => node.props.label === label && typeof node.props.onPress === 'function',
  );
}

function heightInput(tree: renderer.ReactTestRenderer): ReactTestInstance {
  return tree.root.find((node) => node.props.accessibilityLabel === '키(cm)');
}

function button(tree: renderer.ReactTestRenderer, title: string): ReactTestInstance {
  return tree.root.find((node) => node.props.title === title);
}

function textOf(node: ReactTestInstance): string {
  const { children } = node.props;
  return (Array.isArray(children) ? children : [children]).join('');
}

function hasText(tree: renderer.ReactTestRenderer, value: string): boolean {
  return tree.root.findAllByType(Text).some((node) => textOf(node) === value);
}

async function typeHeight(tree: renderer.ReactTestRenderer, value: string): Promise<void> {
  await renderer.act(async () => {
    heightInput(tree).props.onChangeText(value);
  });
  await settle();
}

beforeEach(() => {
  loadProfile.mockReset();
  savePreferences.mockReset();
  loadProfile.mockResolvedValue(profile());
  savePreferences.mockResolvedValue(profile());
});

describe('ProfileScreen gender and height', () => {
  it('summarises what has been set', async () => {
    const tree = await mount();

    expect(hasText(tree, '20대 · 남성 · 178cm')).toBe(true);
  });

  it('falls back to a single line when nothing is set', async () => {
    loadProfile.mockResolvedValue(profile({ age_range: null, gender: null, height_cm: null }));
    const tree = await mount();

    expect(hasText(tree, '나이대 미설정')).toBe(true);
  });

  it('sends the stored values back untouched when nothing is edited', async () => {
    const tree = await mount();
    await press(button(tree, '수정'));

    await press(button(tree, '저장'));

    expect(savePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ gender: 'men', height_cm: 178 }),
    );
  });

  it('sends the catalog value, not the Korean label', async () => {
    const tree = await mount();
    await press(button(tree, '수정'));

    await press(chip(tree, '여성'));
    await press(button(tree, '저장'));

    expect(savePreferences).toHaveBeenCalledWith(expect.objectContaining({ gender: 'women' }));
  });

  it('lets a gender be unset by pressing it again', async () => {
    // 밝히고 싶지 않은 사람에게 선택을 강요하지 않는다.
    const tree = await mount();
    await press(button(tree, '수정'));

    await press(chip(tree, '남성'));
    await press(button(tree, '저장'));

    expect(savePreferences).toHaveBeenCalledWith(expect.objectContaining({ gender: null }));
  });

  it('sends an emptied height as "not set"', async () => {
    const tree = await mount();
    await press(button(tree, '수정'));

    await typeHeight(tree, '');
    await press(button(tree, '저장'));

    expect(savePreferences).toHaveBeenCalledWith(expect.objectContaining({ height_cm: null }));
  });

  it('refuses an impossible height before asking the server', async () => {
    const tree = await mount();
    await press(button(tree, '수정'));

    await typeHeight(tree, '9');
    await press(button(tree, '저장'));

    expect(savePreferences).not.toHaveBeenCalled();
    expect(hasText(tree, '키는 100~250 사이의 숫자로 입력해 주세요.')).toBe(true);
  });

  it('restores the stored values when the edit is cancelled', async () => {
    const tree = await mount();
    await press(button(tree, '수정'));
    await press(chip(tree, '여성'));
    await typeHeight(tree, '150');

    await press(button(tree, '취소'));
    await press(button(tree, '수정'));
    await press(button(tree, '저장'));

    expect(savePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ gender: 'men', height_cm: 178 }),
    );
  });
});
