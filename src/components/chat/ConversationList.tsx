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
  onSelect: (conversationId: string) => void;
  onNewConversation: () => void;
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
  onSelect,
  onNewConversation,
}: ConversationListProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel="새 대화 시작"
        disabled={disabled}
        onPress={onNewConversation}
        style={({ pressed }) => [styles.newButton, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
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
            return (
              <Pressable
                key={conversation.id}
                accessibilityLabel={`대화 열기: ${conversation.title ?? '제목 없는 대화'}`}
                disabled={disabled}
                onPress={() => onSelect(conversation.id)}
                style={({ pressed }) => [
                  styles.item,
                  isActive && styles.itemActive,
                  pressed && !isActive && !disabled && styles.pressed,
                ]}
              >
                <Text style={[styles.itemTitle, isActive && styles.itemTitleActive]} numberOfLines={1}>
                  {conversation.title ?? '제목 없는 대화'}
                </Text>
                <Text style={styles.itemDate}>{formatWhen(conversation.updated_at)}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
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
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  itemActive: {
    backgroundColor: colors.navySoft,
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
