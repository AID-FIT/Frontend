import { likeProduct, unlikeProduct } from '../services/likeService';
import { useLikesStore } from './useLikesStore';
import type { LikeableProduct } from '../services/likeService';

// 네트워크는 이 테스트의 관심사가 아니다. 보려는 것은 하트를 먼저 켜고 실패하면
// 되돌리는 분기뿐이다.
jest.mock('../services/likeService', () => ({
  ...jest.requireActual('../services/likeService'),
  likeProduct: jest.fn(),
  unlikeProduct: jest.fn(),
}));

const likeMock = likeProduct as jest.MockedFunction<typeof likeProduct>;
const unlikeMock = unlikeProduct as jest.MockedFunction<typeof unlikeProduct>;

const product: LikeableProduct = {
  item_id: 'musinsa_1',
  source: 'musinsa',
  item_name: '와이드 슬랙스',
};

beforeEach(() => {
  jest.clearAllMocks();
  useLikesStore.getState().clear();
});

it('좋아요에 성공하면 하트가 켜진 채로 남는다', async () => {
  likeMock.mockResolvedValue({} as never);

  await expect(useLikesStore.getState().toggle(product)).resolves.toBe(true);

  expect(likeMock).toHaveBeenCalledTimes(1);
  expect(useLikesStore.getState().likedRefs.has('musinsa_1')).toBe(true);
});

it('좋아요에 실패하면 켜 두었던 하트를 되돌린다', async () => {
  likeMock.mockRejectedValue(new Error('network'));

  await expect(useLikesStore.getState().toggle(product)).resolves.toBe(false);

  expect(useLikesStore.getState().likedRefs.has('musinsa_1')).toBe(false);
});

it('취소에 실패하면 껐던 하트를 되돌린다', async () => {
  likeMock.mockResolvedValue({} as never);
  await useLikesStore.getState().toggle(product);
  unlikeMock.mockRejectedValue(new Error('network'));

  await expect(useLikesStore.getState().toggle(product)).resolves.toBe(false);

  expect(useLikesStore.getState().likedRefs.has('musinsa_1')).toBe(true);
});

it('가리킬 값이 없는 상품은 서버를 부르지 않는다', async () => {
  await expect(
    useLikesStore.getState().toggle({ source: 'musinsa', item_name: '이름만 있는 상품' }),
  ).resolves.toBe(false);

  expect(likeMock).not.toHaveBeenCalled();
  expect(useLikesStore.getState().likedRefs.size).toBe(0);
});
