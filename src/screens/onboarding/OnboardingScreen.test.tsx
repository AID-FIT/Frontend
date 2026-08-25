import { Text } from 'react-native';
import renderer, { type ReactTestInstance } from 'react-test-renderer';
import { OnboardingScreen } from './OnboardingScreen';
import { completeOnboarding } from '../../services/userService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../../services/userService', () => ({ completeOnboarding: jest.fn() }));
jest.mock('../../services/imageService', () => ({
  getImageFingerprint: jest.fn(),
  pickImageFile: jest.fn().mockResolvedValue(null),
  requestAnalysisInBackground: jest.fn(),
  uploadImage: jest.fn(),
}));
jest.mock('../../store/useAppStore', () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({ completeOnboarding: jest.fn(), user: { nickname: '태훈' } }),
}));

const submit = completeOnboarding as jest.MockedFunction<typeof completeOnboarding>;

async function settle(): Promise<void> {
  await renderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<OnboardingScreen />);
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
    tree.root.find((node) => node.props.accessibilityLabel === '키(cm)').props.onChangeText(value);
  });
  await settle();
}

beforeEach(() => {
  submit.mockReset();
  submit.mockResolvedValue({
    id: 'u1',
    email: null,
    nickname: '태훈',
    role: 'user',
    age_range: '20대',
    gender: 'men',
    height_cm: 178,
    styles: [],
    preferred_colors: [],
    avoid_items: [],
    sizes: {},
  });
});

describe('OnboardingScreen gender and height', () => {
  it('can be finished without answering either', async () => {
    // 처음 만난 사람에게 성별과 키를 요구하지 않는다.
    const tree = await mount();

    await press(button(tree, '시작하기'));

    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ gender: null, height_cm: null }));
  });

  it('carries the answers through to the server', async () => {
    const tree = await mount();

    await press(chip(tree, '여성'));
    await typeHeight(tree, '162');
    await press(button(tree, '시작하기'));

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ gender: 'women', height_cm: 162 }),
    );
  });

  it('stops an impossible height before it reaches the server', async () => {
    const tree = await mount();

    await typeHeight(tree, '300');
    await press(button(tree, '시작하기'));

    expect(submit).not.toHaveBeenCalled();
    expect(hasText(tree, '키는 100~250 사이의 숫자로 입력해 주세요.')).toBe(true);
  });
});
