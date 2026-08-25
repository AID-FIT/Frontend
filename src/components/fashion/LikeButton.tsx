import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { productRefOf, type LikeableProduct } from '../../services/likeService';
import { useLikesStore } from '../../store/useLikesStore';

type LikeButtonProps = {
  product: LikeableProduct;
  /** 카드 종류마다 하트 크기가 다르다. */
  size?: number;
};

export function LikeButton({ product, size = 18 }: LikeButtonProps) {
  const toggle = useLikesStore((state) => state.toggle);
  const productRef = productRefOf(product);
  const isLiked = useLikesStore((state) => (productRef ? state.likedRefs.has(productRef) : false));
  const [isBusy, setIsBusy] = useState(false);

  // 가리킬 것이 없는 상품은 좋아요를 저장할 방법도 없다. 버튼을 두지 않는다.
  if (!productRef) {
    return null;
  }

  const handlePress = async () => {
    if (isBusy) {
      return;
    }
    setIsBusy(true);
    try {
      await toggle(product);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isLiked }}
      accessibilityLabel={isLiked ? '좋아요 취소' : '좋아요'}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        { width: size + 16, height: size + 16 },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={isLiked ? 'heart' : 'heart-outline'}
        size={size}
        color={isLiked ? colors.danger : colors.white}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    // 밝은 상품 사진 위에서도 하트가 보이도록 어두운 판을 깐다.
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
