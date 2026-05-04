import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppCard } from '../../components/common/AppCard';
import { Chip } from '../../components/common/Chip';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { mockUser } from '../../mocks/user';
import { useAppStore } from '../../store/useAppStore';

export function ProfileScreen() {
  const resetSession = useAppStore((state) => state.resetSession);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>내 정보</Text>
      </View>

      <AppCard style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={34} color={colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{mockUser.name}님</Text>
          <Text style={styles.meta}>{mockUser.ageRange}</Text>
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>선호 스타일</Text>
        <View style={styles.tags}>
          {mockUser.styles.map((style) => (
            <Chip key={style} label={style} selected />
          ))}
        </View>
      </AppCard>

      <View style={styles.actions}>
        <AppButton title="수정" variant="secondary" onPress={() => undefined} />
        <AppButton title="로그아웃" variant="ghost" onPress={resetSession} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: 0,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    lineHeight: 44,
    letterSpacing: letterSpacing.heading,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navySoft,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  meta: {
    color: colors.subText,
    fontSize: 14,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
