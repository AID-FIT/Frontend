import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';

type ChatComposerProps = {
  value: string;
  attachments: string[];
  pendingAttachmentCount?: number;
  canSend: boolean;
  isSending: boolean;
  isUploading: boolean;
  // 이미 빈 대화에서 또 시작하면 빈 대화만 쌓이므로 호출부에서 막는다.
  canStartNewConversation: boolean;
  onChangeText: (value: string) => void;
  onAttach: () => void;
  onNewConversation: () => void;
  onRemoveAttachment: (imageUrl: string) => void;
  onSend: () => void;
};

export function ChatComposer({
  value,
  attachments,
  pendingAttachmentCount = 0,
  canSend,
  isSending,
  isUploading,
  canStartNewConversation,
  onChangeText,
  onAttach,
  onNewConversation,
  onRemoveAttachment,
  onSend,
}: ChatComposerProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasAttachments = attachments.length > 0 || pendingAttachmentCount > 0;

  const handlePickFromMenu = () => {
    setIsMenuOpen(false);
    onAttach();
  };

  const handleNewConversationFromMenu = () => {
    setIsMenuOpen(false);
    onNewConversation();
  };

  return (
    <View style={styles.wrap}>
      {hasAttachments ? (
        <View style={styles.attachments}>
          {attachments.map((imageUrl) => (
            <View key={imageUrl} style={styles.thumb}>
              <Image source={{ uri: imageUrl }} style={styles.thumbImage} resizeMode="cover" />
              <Pressable
                accessibilityLabel="첨부 사진 삭제"
                onPress={() => onRemoveAttachment(imageUrl)}
                style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
              >
                <Ionicons name="close" size={12} color={colors.white} />
              </Pressable>
            </View>
          ))}

          {/* 업로드가 끝나지 않은 장수만큼 자리를 미리 잡는다. */}
          {Array.from({ length: pendingAttachmentCount }).map((_, index) => (
            <View key={`pending-${index}`} style={styles.thumb}>
              <Skeleton width="100%" height="100%" borderRadius={radius.md} />
            </View>
          ))}
        </View>
      ) : null}

      {isMenuOpen ? (
        <>
          {/* 바깥 아무 곳이나 누르면 닫히도록 위쪽 영역을 덮는다. */}
          <Pressable
            accessibilityLabel="첨부 메뉴 닫기"
            onPress={() => setIsMenuOpen(false)}
            style={styles.backdrop}
          />
          <View style={styles.popover}>
            <Pressable
              accessibilityLabel="사진 선택하기"
              onPress={handlePickFromMenu}
              style={({ pressed }) => [styles.popoverItem, pressed && styles.popoverItemPressed]}
            >
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={styles.popoverLabel}>사진 선택하기</Text>
            </Pressable>

            <View style={styles.popoverDivider} />

            <Pressable
              accessibilityLabel="새 대화 시작"
              disabled={!canStartNewConversation}
              onPress={handleNewConversationFromMenu}
              style={({ pressed }) => [
                styles.popoverItem,
                pressed && canStartNewConversation && styles.popoverItemPressed,
                !canStartNewConversation && styles.disabled,
              ]}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={styles.popoverLabel}>새 대화 시작</Text>
            </Pressable>

            {/* + 버튼을 가리키는 꼬리 */}
            <View style={styles.popoverTail} />
          </View>
        </>
      ) : null}

      <View style={styles.inputRow}>
        <Pressable
          accessibilityLabel="사진 첨부"
          disabled={isUploading || isSending}
          onPress={() => setIsMenuOpen((open) => !open)}
          style={({ pressed }) => [
            styles.iconButton,
            isMenuOpen && styles.iconButtonActive,
            pressed && styles.iconButtonPressed,
            (isUploading || isSending) && styles.disabled,
          ]}
        >
          <Ionicons name="add" size={22} color={isMenuOpen ? colors.white : colors.primary} />
        </Pressable>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="어떤 스타일을 찾고 있나요?"
          placeholderTextColor={colors.subText}
          multiline
          style={styles.input}
          editable={!isSending}
          onSubmitEditing={() => canSend && onSend()}
        />

        <Pressable
          accessibilityLabel="보내기"
          disabled={!canSend}
          onPress={onSend}
          style={({ pressed }) => [
            styles.sendButton,
            pressed && canSend && styles.sendButtonPressed,
            !canSend && styles.disabled,
          ]}
        >
          {isUploading ? (
            <Text style={styles.sendLabel}>업로드</Text>
          ) : (
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  // 입력 바 위쪽 화면 전체를 덮어 바깥 터치를 받는다.
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    height: 1200,
  },
  popover: {
    position: 'absolute',
    left: spacing.xl,
    bottom: '100%',
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    shadowColor: colors.canvasDark,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  popoverItemPressed: {
    opacity: 0.7,
  },
  popoverDivider: {
    height: 1,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.border,
  },
  popoverLabel: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  popoverTail: {
    position: 'absolute',
    left: 14,
    bottom: -5,
    width: 10,
    height: 10,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
  attachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  remove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePressed: {
    opacity: 0.7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  iconButtonPressed: {
    opacity: 0.82,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  sendButton: {
    minWidth: 42,
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  sendLabel: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  disabled: {
    opacity: 0.45,
  },
});
