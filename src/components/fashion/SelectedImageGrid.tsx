import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';

type SelectedImageGridProps = {
  imageUrls: string[];
  pendingCount?: number;
  disabled?: boolean;
  onRemove: (imageUrl: string) => void;
  onAdd: () => void;
};

export function SelectedImageGrid({
  imageUrls,
  pendingCount = 0,
  disabled = false,
  onRemove,
  onAdd,
}: SelectedImageGridProps) {
  return (
    <View style={styles.grid}>
      {imageUrls.map((imageUrl, index) => (
        <View key={imageUrl} style={styles.tile}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          <Pressable
            accessibilityLabel={`${index + 1}번째 사진 삭제`}
            disabled={disabled}
            onPress={() => onRemove(imageUrl)}
            style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
          >
            <Ionicons name="close" size={14} color={colors.white} />
          </Pressable>
        </View>
      ))}

      {/* 업로드가 끝나지 않은 장수만큼 자리를 미리 잡아 레이아웃이 튀지 않게 한다. */}
      {Array.from({ length: pendingCount }).map((_, index) => (
        <View key={`pending-${index}`} style={styles.tile}>
          <Skeleton width="100%" height="100%" borderRadius={radius.lg} />
        </View>
      ))}

      <Pressable
        accessibilityLabel="사진 더 추가"
        disabled={disabled}
        onPress={onAdd}
        style={({ pressed }) => [styles.addTile, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
      >
        <Ionicons name="add" size={24} color={colors.primary} />
        <Text style={styles.addLabel}>사진 추가</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePressed: {
    opacity: 0.7,
  },
  addTile: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ashLight,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addLabel: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
});
