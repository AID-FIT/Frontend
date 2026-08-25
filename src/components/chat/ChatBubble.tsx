import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';
import type { ChatRole, SelectedClosetItem } from '../../services/chatService';

type ChatBubbleProps = {
  role: ChatRole;
  content: string;
  imageUrls?: string[];
  /** 그 질문에 함께 보낸 옷장 아이템. 서버가 메시지에 남겨 둔 스냅샷이다. */
  closetItems?: SelectedClosetItem[];
  children?: ReactNode;
};

export function ChatBubble({
  role,
  content,
  imageUrls = [],
  closetItems = [],
  children,
}: ChatBubbleProps) {
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

        {closetItems.length > 0 ? (
          <View style={styles.closet}>
            <Text style={[styles.closetLabel, isUser && styles.closetLabelUser]}>
              옷장에서 가져온 옷
            </Text>
            <View style={styles.attachments}>
              {closetItems.map((item) => (
                <Image
                  key={item.closet_item_id}
                  // 옷장에서 지운 옷이면 이미지가 비어 있을 수 있다. 그래도 자리는 남긴다.
                  source={{ uri: item.image_url ?? undefined }}
                  style={styles.attachment}
                  resizeMode="cover"
                />
              ))}
            </View>
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
  closet: {
    gap: spacing.xs,
  },
  closetLabel: {
    color: colors.subText,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  closetLabelUser: {
    color: colors.white,
    opacity: 0.8,
  },
});
