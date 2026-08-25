import { create } from 'zustand';
import {
  likeProduct,
  listLikedRefs,
  productRefOf,
  unlikeProduct,
  type LikeableProduct,
} from '../services/likeService';

type LikesState = {
  /** 좋아요한 상품의 식별자. 홈과 추천 탭이 같은 하트 상태를 본다. */
  likedRefs: Set<string>;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  clear: () => void;
  /** 눌렀을 때 켜고 끄기. 실패하면 되돌린다. */
  toggle: (product: LikeableProduct) => Promise<boolean>;
};

export const useLikesStore = create<LikesState>((set, get) => ({
  likedRefs: new Set(),
  isHydrated: false,

  hydrate: async () => {
    try {
      set({ likedRefs: new Set(await listLikedRefs()), isHydrated: true });
    } catch {
      // 하트가 비어 보일 뿐 화면은 그대로 쓸 수 있다. 오류를 띄우지 않는다.
      set({ isHydrated: true });
    }
  },

  clear: () => set({ likedRefs: new Set(), isHydrated: false }),

  toggle: async (product) => {
    const productRef = productRefOf(product);
    if (!productRef) {
      return false;
    }

    const wasLiked = get().likedRefs.has(productRef);
    // 서버를 기다리면 하트가 굼떠 보인다. 먼저 바꾸고 실패하면 되돌린다.
    const optimistic = new Set(get().likedRefs);
    if (wasLiked) {
      optimistic.delete(productRef);
    } else {
      optimistic.add(productRef);
    }
    set({ likedRefs: optimistic });

    try {
      if (wasLiked) {
        await unlikeProduct(productRef);
      } else {
        await likeProduct(product);
      }
      return true;
    } catch {
      const reverted = new Set(get().likedRefs);
      if (wasLiked) {
        reverted.add(productRef);
      } else {
        reverted.delete(productRef);
      }
      set({ likedRefs: reverted });
      return false;
    }
  },
}));
