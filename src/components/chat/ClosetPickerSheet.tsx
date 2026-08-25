import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ClosetGridSkeleton } from '../fashion/ClosetGridSkeleton';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';
import type { ClosetItem } from '../../services/closetService';

type ClosetPickerSheetProps = {
  items: ClosetItem[];
  /** 시트를 열 때 이미 골라 둔 아이템. 취소하면 이 상태로 되돌아간다. */
  initialSelectedIds: string[];
  maxSelection: number;
  isLoading: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (items: ClosetItem[]) => void;
};

export function ClosetPickerSheet({
  items,
  initialSelectedIds,
  maxSelection,
  isLoading,
  error = '',
  onCancel,
  onConfirm,
}: ClosetPickerSheetProps) {
  // 시트는 닫을 때 언마운트되므로 열 때마다 이 초기값을 다시 잡는다. 이것을
  // effect로 다시 맞추면 안 된다 — initialSelectedIds는 부모가 매번 새로 만드는
  // 배열이라, 입력창에 글자를 칠 때마다 고르던 선택이 초기화된다.
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const isFull = selectedIds.length >= maxSelection;

  const toggle = (itemId: string) => {
    setSelectedIds((current) => {
      if (current.includes(itemId)) {
        return current.filter((id) => id !== itemId);
      }
      // 상한을 넘기면 조용히 자르는 대신 아무 일도 일어나지 않게 둔다.
      return current.length >= maxSelection ? current : [...current, itemId];
    });
  };

  const confirm = () => {
    // 고른 순서를 그대로 서버에 넘긴다. 순서가 곧 사용자가 말한 우선순위다.
    const byId = new Map(items.map((item) => [item.id, item]));
    onConfirm(selectedIds.map((id) => byId.get(id)).filter((item): item is ClosetItem => Boolean(item)));
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Text style={styles.title}>옷장에서 가져오기</Text>
        <Text style={styles.count}>
          {selectedIds.length} / {maxSelection}
        </Text>
      </View>

      <Text style={styles.hint}>고른 옷만 이번 질문의 기준이 돼요. 고르지 않으면 옷장 전체를 봐요.</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {isLoading ? (
        <ClosetGridSkeleton count={4} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="shirt-outline" size={32} color={colors.accentTeal} />
          <Text style={styles.emptyText}>{error ? '다시 시도해 주세요.' : '옷장이 비어 있어요.'}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: !isSelected && isFull }}
                accessibilityLabel={`옷장 아이템 선택: ${item.name}`}
                disabled={!isSelected && isFull}
                onPress={() => toggle(item.id)}
                style={({ pressed }) => [
                  styles.item,
                  isSelected && styles.itemSelected,
                  !isSelected && isFull && styles.itemDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Image source={{ uri: item.image_url }} style={styles.thumb} resizeMode="cover" />
                {isSelected ? (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={13} color={colors.white} />
                  </View>
                ) : null}
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.category ? (
                  <Text style={styles.itemCategory} numberOfLines={1}>
                    {item.category}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="옷장 선택 취소"
          onPress={onCancel}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>취소</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="옷장 선택 완료"
          onPress={confirm}
          style={({ pressed }) => [styles.action, styles.actionPrimary, pressed && styles.pressed]}
        >
          <Text style={styles.actionPrimaryText}>
            {selectedIds.length > 0 ? `${selectedIds.length}벌 가져오기` : '선택 없이 닫기'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 대화 목록 오버레이와 같은 방식으로 얹는다. react-native-web에는 Modal을
  // 쓰지 않는 것이 이 저장소의 관례다.
  sheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: '100%',
    marginBottom: spacing.xs,
    maxHeight: 420,
    zIndex: 12,
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.lg,
    shadowColor: colors.canvasDark,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  count: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  hint: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  item: {
    width: '31%',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.navySoft,
  },
  itemDisabled: {
    opacity: 0.4,
  },
  thumb: {
    width: '100%',
    height: 68,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
  },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
  },
  itemCategory: {
    color: colors.subText,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.subText,
    fontSize: 13,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  action: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionText: {
    color: colors.subText,
    fontSize: 13,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  actionPrimaryText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  pressed: {
    opacity: 0.72,
  },
});
