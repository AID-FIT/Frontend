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
  onChangeText: (value: string) => void;
  onAttach: () => void;
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
  onChangeText,
  onAttach,
  onRemoveAttachment,
  onSend,
}: ChatComposerProps) {
  const hasAttachments = attachments.length > 0 || pendingAttachmentCount > 0;

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

      <View style={styles.inputRow}>
        <Pressable
          accessibilityLabel="사진 첨부"
          disabled={isUploading || isSending}
          onPress={onAttach}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
            (isUploading || isSending) && styles.disabled,
          ]}
        >
          <Ionicons name="image-outline" size={20} color={colors.primary} />
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
