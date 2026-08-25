import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';
import type { Conversation } from '../../services/chatService';

type ConversationListProps = {
  conversations: Conversation[];
  activeId: string | null;
  disabled?: boolean;
  /** 삭제 요청이 아직 끝나지 않은 대화. 그동안 목록 전체를 잠근다. */
  deletingId?: string | null;
  onSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onDelete?: (conversationId: string) => void;
  onDeleteAll?: () => void;
};

// 목록에서는 언제 나눈 대화인지가 제목만큼 중요하다.
function formatWhen(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

export function ConversationList({
  conversations,
  activeId,
  disabled = false,
  deletingId = null,
  onSelect,
  onNewConversation,
  onDelete,
  onDeleteAll,
}: ConversationListProps) {
  // 삭제는 되돌릴 수 없으니 한 번 더 확인받는다.
  // react-native-web에는 Alert가 없어 시스템 확인창은 쓸 수 없다.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);
  const isBusy = disabled || deletingId !== null;

  const confirmDelete = (conversationId: string) => {
    setPendingDeleteId(null);
    onDelete?.(conversationId);
  };

  const confirmDeleteAll = () => {
    setIsConfirmingDeleteAll(false);
    onDeleteAll?.();
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel="새 대화 시작"
        disabled={isBusy}
        onPress={onNewConversation}
        style={({ pressed }) => [styles.newButton, pressed && !isBusy && styles.pressed, isBusy && styles.disabled]}
      >
        <Ionicons name="add" size={16} color={colors.primary} />
        <Text style={styles.newLabel}>새 대화</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {conversations.length === 0 ? (
          <Text style={styles.emptyText}>아직 대화가 없어요.</Text>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === activeId;
            const title = conversation.title ?? '제목 없는 대화';

            if (deletingId === conversation.id) {
              return (
                <View key={conversation.id} style={styles.item}>
                  <Text style={styles.confirmText}>삭제 중…</Text>
                </View>
              );
            }

            if (pendingDeleteId === conversation.id) {
              return (
                <View key={conversation.id} style={[styles.item, styles.confirmRow]}>
                  <Text style={styles.confirmText} numberOfLines={1}>
                    삭제할까요?
                  </Text>
                  <View style={styles.confirmActions}>
                    <Pressable
                      accessibilityLabel="대화 삭제 취소"
                      onPress={() => setPendingDeleteId(null)}
                      style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.confirmCancelText}>취소</Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`대화 삭제 확인: ${title}`}
                      onPress={() => confirmDelete(conversation.id)}
                      style={({ pressed }) => [
                        styles.confirmButton,
                        styles.confirmDanger,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.confirmDangerText}>삭제</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }

            return (
              <View key={conversation.id} style={[styles.item, isActive && styles.itemActive]}>
                <Pressable
                  accessibilityLabel={`대화 열기: ${title}`}
                  disabled={isBusy}
                  onPress={() => onSelect(conversation.id)}
                  style={({ pressed }) => [styles.itemBody, pressed && !isActive && !isBusy && styles.pressed]}
                >
                  <Text style={[styles.itemTitle, isActive && styles.itemTitleActive]} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.itemDate}>{formatWhen(conversation.updated_at)}</Text>
                </Pressable>

                {onDelete ? (
                  <Pressable
                    accessibilityLabel={`대화 삭제: ${title}`}
                    disabled={isBusy}
                    onPress={() => setPendingDeleteId(conversation.id)}
                    style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed, isBusy && styles.disabled]}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.subText} />
                  </Pressable>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {onDeleteAll && conversations.length > 0 ? (
        isConfirmingDeleteAll ? (
          <View style={styles.deleteAllConfirm}>
            <Text style={styles.confirmText}>대화 {conversations.length}개를 모두 지울까요?</Text>
            <View style={styles.confirmActions}>
              <Pressable
                accessibilityLabel="전체 삭제 취소"
                onPress={() => setIsConfirmingDeleteAll(false)}
                style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
              >
                <Text style={styles.confirmCancelText}>취소</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="전체 삭제 확인"
                onPress={confirmDeleteAll}
                style={({ pressed }) => [styles.confirmButton, styles.confirmDanger, pressed && styles.pressed]}
              >
                <Text style={styles.confirmDangerText}>모두 삭제</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityLabel="전체 대화 삭제"
            disabled={isBusy}
            onPress={() => setIsConfirmingDeleteAll(true)}
            style={({ pressed }) => [styles.deleteAll, pressed && !isBusy && styles.pressed, isBusy && styles.disabled]}
          >
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
            <Text style={styles.deleteAllLabel}>전체 삭제</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    gap: spacing.sm,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 38,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ashLight,
    backgroundColor: colors.white,
  },
  newLabel: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  list: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  itemActive: {
    backgroundColor: colors.navySoft,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
  },
  itemTitleActive: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  itemDate: {
    color: colors.subText,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  deleteButton: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRow: {
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  confirmText: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  confirmButton: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
  },
  confirmDanger: {
    backgroundColor: colors.danger,
  },
  confirmCancelText: {
    color: colors.subText,
    fontSize: 11,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  confirmDangerText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  deleteAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 32,
    borderRadius: radius.lg,
  },
  deleteAllLabel: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  deleteAllConfirm: {
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  emptyText: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
});
