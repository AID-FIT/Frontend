import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';

type ImageUploadBoxProps = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export function ImageUploadBox({
  title = '사진 추가',
  description = '옷 사진을 올려주세요',
  compact = false,
}: ImageUploadBoxProps) {
  return (
    <Pressable style={[styles.box, compact && styles.compact]}>
      <View style={styles.iconWrap}>
        <Ionicons name="camera-outline" size={compact ? 18 : 26} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!compact ? <Text style={styles.description}>{description}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 196,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ashLight,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  compact: {
    minHeight: 102,
    flex: 1,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navySoft,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  description: {
    color: colors.subText,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});
