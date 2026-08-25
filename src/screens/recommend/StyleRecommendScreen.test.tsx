import renderer, { type ReactTestInstance } from 'react-test-renderer';
import { StyleRecommendScreen } from './StyleRecommendScreen';
import {
  createConversation,
  deleteAllConversations,
  deleteConversation,
  listConversations,
  listMessages,
  sendMessage,
  type Conversation,
} from '../../services/chatService';
import { listClosetItems } from '../../services/closetService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../../services/chatService', () => ({
  createConversation: jest.fn(),
  deleteAllConversations: jest.fn(),
  deleteConversation: jest.fn(),
  listConversations: jest.fn(),
  listMessages: jest.fn(),
  sendMessage: jest.fn(),
}));
jest.mock('../../services/closetService', () => ({ listClosetItems: jest.fn() }));
jest.mock('../../services/imageService', () => ({
  getImageFingerprint: jest.fn(),
  pickImageFiles: jest.fn().mockResolvedValue([]),
  requestAnalysisInBackground: jest.fn(),
  uploadImage: jest.fn(),
}));

const create = createConversation as jest.MockedFunction<typeof createConversation>;
const list = listConversations as jest.MockedFunction<typeof listConversations>;
const messages = listMessages as jest.MockedFunction<typeof listMessages>;
const removeOne = deleteConversation as jest.MockedFunction<typeof deleteConversation>;
const removeAll = deleteAllConversations as jest.MockedFunction<typeof deleteAllConversations>;
const send = sendMessage as jest.MockedFunction<typeof sendMessage>;
const closet = listClosetItems as jest.MockedFunction<typeof listClosetItems>;

function conversation(id: string, title: string): Conversation {
  return {
    id,
    title,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  };
}

// 부트스트랩(목록 조회 → 히스토리 조회)이 여러 단계라 act 한 번으로는 정착하지 않는다.
async function settle(): Promise<void> {
  await renderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    jest.runOnlyPendingTimers();
  });
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<StyleRecommendScreen />);
  });
  await settle();
  return tree;
}

function byLabel(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  return tree.root.find((node) => node.props.accessibilityLabel === label);
}

function queryByLabel(
  tree: renderer.ReactTestRenderer,
  label: string,
): ReactTestInstance | undefined {
  return tree.root.findAll((node) => node.props.accessibilityLabel === label)[0];
}

async function press(node: ReactTestInstance): Promise<void> {
  await renderer.act(async () => {
    node.props.onPress();
  });
  await settle();
}

// 좁은 화면(jest 기본 폭)에서는 대화 목록이 토글로만 열린다.
// 토글이라 한 번 더 부르면 닫히므로, 목록이 닫혔을 때만 부른다.
async function openSidebar(tree: renderer.ReactTestRenderer): Promise<void> {
  const toggle = queryByLabel(tree, '대화 목록 열기');
  if (toggle) {
    await press(toggle);
  }
}

async function deleteConversationNamed(
  tree: renderer.ReactTestRenderer,
  title: string,
): Promise<void> {
  await press(byLabel(tree, `대화 삭제: ${title}`));
  await press(byLabel(tree, `대화 삭제 확인: ${title}`));
}

beforeEach(() => {
  jest.useFakeTimers();
  create.mockReset();
  list.mockReset();
  messages.mockReset();
  removeOne.mockReset();
  removeAll.mockReset();
  send.mockReset();
  closet.mockReset();

  list.mockResolvedValue([conversation('c1', '겨울 코디'), conversation('c2', '면접 룩')]);
  messages.mockResolvedValue({ messages: [], next_cursor: null });
  create.mockResolvedValue(conversation('c-new', '새 대화'));
  removeOne.mockResolvedValue(undefined);
  removeAll.mockResolvedValue(undefined);
  closet.mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('deleting a conversation', () => {
  it('drops it from the list', async () => {
    const tree = await mount();
    await openSidebar(tree);

    await deleteConversationNamed(tree, '면접 룩');

    expect(removeOne).toHaveBeenCalledWith('c2');
    expect(queryByLabel(tree, '대화 열기: 면접 룩')).toBeUndefined();
    expect(queryByLabel(tree, '대화 열기: 겨울 코디')).toBeDefined();
    expect(queryByLabel(tree, '대화 삭제: 겨울 코디')).toBeDefined();
  });

  it('opens the next one when the open conversation is deleted', async () => {
    // 보고 있던 대화가 사라졌는데 화면이 빈 채로 남으면 안 된다.
    const tree = await mount();
    await openSidebar(tree);
    messages.mockClear();

    await deleteConversationNamed(tree, '겨울 코디');

    expect(messages).toHaveBeenCalledWith('c2', { limit: 50 });
    expect(create).not.toHaveBeenCalled();
  });

  it('starts a fresh conversation when the last one is deleted', async () => {
    list.mockResolvedValue([conversation('c1', '겨울 코디')]);
    const tree = await mount();
    await openSidebar(tree);

    await deleteConversationNamed(tree, '겨울 코디');

    expect(create).toHaveBeenCalledTimes(1);
    expect(queryByLabel(tree, '대화 열기: 새 대화')).toBeDefined();
  });

  it('keeps the list untouched when the request fails', async () => {
    removeOne.mockRejectedValue(new Error('boom'));
    const tree = await mount();
    await openSidebar(tree);

    await deleteConversationNamed(tree, '면접 룩');

    expect(queryByLabel(tree, '대화 열기: 면접 룩')).toBeDefined();
  });
});

describe('deleting every conversation', () => {
  it('wipes the list and leaves a usable empty conversation', async () => {
    const tree = await mount();
    await openSidebar(tree);

    await press(byLabel(tree, '전체 대화 삭제'));
    await press(byLabel(tree, '전체 삭제 확인'));

    expect(removeAll).toHaveBeenCalledTimes(1);
    await openSidebar(tree);
    expect(queryByLabel(tree, '대화 열기: 겨울 코디')).toBeUndefined();
    expect(queryByLabel(tree, '대화 열기: 새 대화')).toBeDefined();
  });

  it('keeps the list when the request fails', async () => {
    removeAll.mockRejectedValue(new Error('boom'));
    const tree = await mount();
    await openSidebar(tree);

    await press(byLabel(tree, '전체 대화 삭제'));
    await press(byLabel(tree, '전체 삭제 확인'));

    // 지우지 못했으면 목록도 그대로 남아 있어야 한다.
    expect(queryByLabel(tree, '대화 열기: 겨울 코디')).toBeDefined();
  });
});

describe('taking clothes from the closet', () => {
  const jacket = {
    id: 'closet_1',
    image_id: 'image_1',
    name: '검은 재킷',
    brand: null,
    price: null,
    category: '아우터',
    sub_category: null,
    gender: null,
    image_url: 'https://cdn.aidfit.com/closet_1.jpg',
    product_url: null,
    color: null,
    material: null,
    fit: null,
    pattern: null,
    mood: null,
    sense_of_season: null,
    is_match: true,
  };

  async function openPicker(tree: renderer.ReactTestRenderer): Promise<void> {
    await press(byLabel(tree, '사진 첨부'));
    await press(byLabel(tree, '옷장에서 가져오기'));
  }

  it('loads the closet only when the picker is opened', async () => {
    closet.mockResolvedValue([jacket]);
    const tree = await mount();

    expect(closet).not.toHaveBeenCalled();

    await openPicker(tree);

    expect(closet).toHaveBeenCalledTimes(1);
    expect(queryByLabel(tree, '옷장 아이템 선택: 검은 재킷')).toBeDefined();
  });

  it('sends the chosen ids alongside the question', async () => {
    closet.mockResolvedValue([jacket]);
    send.mockResolvedValue({
      conversation_id: 'c1',
      user_message_id: 'm1',
      assistant_message_id: 'm2',
      response: { status: 'empty', message: '없어요', recommendations: [], style_guide: null },
    });
    const tree = await mount();
    await openPicker(tree);
    await press(byLabel(tree, '옷장 아이템 선택: 검은 재킷'));
    await press(byLabel(tree, '옷장 선택 완료'));

    const input = tree.root.find((node) => typeof node.props.onChangeText === 'function');
    await renderer.act(async () => {
      input.props.onChangeText('이 재킷에 어울리는 바지');
    });
    await press(byLabel(tree, '보내기'));

    expect(send).toHaveBeenCalledWith('c1', '이 재킷에 어울리는 바지', [], ['closet_1']);
  });

  it('keeps the selection while the question is being typed', async () => {
    // 피커는 입력 바 위에 얹힐 뿐이라 그 뒤 입력창이 살아 있다. 타이핑으로
    // 화면이 다시 그려질 때 고르던 것이 날아가면 안 된다.
    closet.mockResolvedValue([jacket]);
    const tree = await mount();
    await openPicker(tree);
    await press(byLabel(tree, '옷장 아이템 선택: 검은 재킷'));

    const input = tree.root.find((node) => typeof node.props.onChangeText === 'function');
    await renderer.act(async () => {
      input.props.onChangeText('이 재킷에');
    });
    await press(byLabel(tree, '옷장 선택 완료'));

    expect(queryByLabel(tree, '옷장 선택 해제: 검은 재킷')).toBeDefined();
  });

  it('clears the selection after the question is sent', async () => {
    closet.mockResolvedValue([jacket]);
    send.mockResolvedValue({
      conversation_id: 'c1',
      user_message_id: 'm1',
      assistant_message_id: 'm2',
      response: { status: 'empty', message: '없어요', recommendations: [], style_guide: null },
    });
    const tree = await mount();
    await openPicker(tree);
    await press(byLabel(tree, '옷장 아이템 선택: 검은 재킷'));
    await press(byLabel(tree, '옷장 선택 완료'));

    const input = tree.root.find((node) => typeof node.props.onChangeText === 'function');
    await renderer.act(async () => {
      input.props.onChangeText('추천해줘');
    });
    await press(byLabel(tree, '보내기'));

    expect(queryByLabel(tree, '옷장 선택 해제: 검은 재킷')).toBeUndefined();
  });

  it('puts the selection back when sending fails', async () => {
    // 다시 고르게 만들면 실패의 대가를 사용자가 치른다.
    closet.mockResolvedValue([jacket]);
    send.mockRejectedValue(new Error('boom'));
    const tree = await mount();
    await openPicker(tree);
    await press(byLabel(tree, '옷장 아이템 선택: 검은 재킷'));
    await press(byLabel(tree, '옷장 선택 완료'));

    const input = tree.root.find((node) => typeof node.props.onChangeText === 'function');
    await renderer.act(async () => {
      input.props.onChangeText('추천해줘');
    });
    await press(byLabel(tree, '보내기'));

    expect(queryByLabel(tree, '옷장 선택 해제: 검은 재킷')).toBeDefined();
  });
});
