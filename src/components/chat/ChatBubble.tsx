import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';
import type { ChatRole } from '../../services/chatService';

type ChatBubbleProps = {
  role: ChatRole;
  content: string;
  imageUrls?: string[];
  children?: ReactNode;
};

export function ChatBubble({ role, content, imageUrls = [], children }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {imageUrls.length > 0 ? (
          <View style={styles.attachments}>
            {imageUrls.map((imageUrl) => (
              <Image key={imageUrl} source={{ uri: imageUrl }} style={styles.attachment} resizeMode="cover" />
            ))}
          </View>
        ) : null}

        {content ? (
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>{content}</Text>
        ) : null}
      </View>

      {/* 추천 카드처럼 말풍선 밖으로 넓게 흐르는 내용은 여기에 붙인다. */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.lg,
    maxWidth: '100%',
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.xs,
  },
  bubbleAssistant: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.xs,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  textUser: {
    color: colors.white,
  },
  textAssistant: {
    color: colors.text,
  },
  attachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  attachment: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
  },
});
