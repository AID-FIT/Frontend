import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';

type ChipProps = {
  label: string;
  selected?: boolean;
  /** 이 칩에 걸리는 개수. 누르기 전에 결과를 미리 알려 준다. */
  count?: number;
  /** 누를 수는 있지만 결과가 없는 칩을 막는다. */
  disabled?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, count, disabled = false, onPress }: ChipProps) {
  const inactive = disabled || !onPress;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected, disabled } : undefined}
      disabled={inactive}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
      {count === undefined ? null : (
        <Text style={[styles.count, selected && styles.selectedCount]}>{count}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.navySoft,
    borderColor: colors.hairlineLight,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    color: colors.subText,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
  },
  selectedText: {
    color: colors.primary,
  },
  count: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  selectedCount: {
    color: colors.primary,
  },
});
