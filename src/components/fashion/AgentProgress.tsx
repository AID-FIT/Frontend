import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, typography } from '../../constants/typography';

export type ProgressStep = {
  node: string;
  label: string;
  detail?: string | null;
};

type AgentProgressProps = {
  steps: ProgressStep[];
  /** 서버에서 실제 진행을 받고 있는지. false면 시간 기반 추정이다. */
  live: boolean;
};

/**
 * 추천을 만드는 동안 어느 단계인지 보여준다.
 *
 * 이전에는 13초 내내 스켈레톤만 떠서 동작 중인지 멈춘 건지 알 수 없었다.
 * 서버가 노드마다 실제 수치를 보내 주므로 그대로 쌓아 보여준다.
 */
export function AgentProgress({ steps, live }: AgentProgressProps) {
  if (steps.length === 0) {
    return null;
  }

  const lastIndex = steps.length - 1;

  return (
    <View style={styles.card} accessibilityLabel="추천을 만드는 중">
      <View style={styles.header}>
        <Text style={styles.title}>추천을 만들고 있어요</Text>
        {live ? null : (
          // 추정 진행을 실제 진행인 척 보여주면 사용자를 속이는 것이 된다.
          <View style={styles.badge}>
            <Text style={styles.badgeText}>예상</Text>
          </View>
        )}
      </View>

      {steps.map((step, index) => {
        const isCurrent = index === lastIndex;
        return (
          <View key={`${step.node}-${index}`} style={styles.row}>
            <View style={styles.icon}>
              {isCurrent ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              )}
            </View>
            <Text style={[styles.label, isCurrent && styles.labelCurrent]} numberOfLines={2}>
              {step.label}
            </Text>
            {step.detail ? <Text style={styles.detail} numberOfLines={1}>{step.detail}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
  },
  badgeText: {
    color: colors.subText,
    fontSize: typography.caption,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 18,
    alignItems: 'center',
  },
  label: {
    flex: 1,
    minWidth: 0,
    color: colors.subText,
    fontSize: typography.caption,
  },
  labelCurrent: {
    color: colors.text,
  },
  detail: {
    color: colors.subText,
    fontSize: typography.caption,
  },
});
