import { useEffect, useState } from 'react';
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
import {
  getMyProfile,
  profileToAuthUser,
  updateMyPreferences,
  type UserProfileResponse,
} from '../../services/userService';
import { useAppStore } from '../../store/useAppStore';

const ageOptions = ['10대', '20대', '30대', '40대 이상'];
const styleOptions = ['캐주얼', '미니멀', '스트릿', '포멀', '스포티'];

export function ProfileScreen() {
  const resetSession = useAppStore((state) => state.resetSession);
  const syncUser = useAppStore((state) => state.syncUser);
  const authUser = useAppStore((state) => state.user);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftAge, setDraftAge] = useState('');
  const [draftStyles, setDraftStyles] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    getMyProfile()
      .then((nextProfile) => {
        setProfile(nextProfile);
        setDraftAge(nextProfile.age_range ?? '20대');
        setDraftStyles(nextProfile.styles);
      })
      .catch(() => {
        setError('프로필 정보를 불러오지 못했어요.');
      });
  }, []);

  const nickname = profile?.nickname ?? authUser?.nickname ?? 'AID-FIT 사용자';
  const ageRange = profile?.age_range ?? '나이대 미설정';
  const preferredStyles = profile?.styles ?? [];

  const toggleDraftStyle = (style: string) => {
    setDraftStyles((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style],
    );
  };

  const startEditing = () => {
    setError('');
    setDraftAge(profile?.age_range ?? '20대');
    setDraftStyles(profile?.styles ?? []);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setError('');
    setIsEditing(false);
    setDraftAge(profile?.age_range ?? '20대');
    setDraftStyles(profile?.styles ?? []);
  };

  const saveProfile = () => {
    setError('');
    setIsSaving(true);
    updateMyPreferences({
      age_range: draftAge,
      styles: draftStyles,
      preferred_colors: profile?.preferred_colors ?? [],
      avoid_items: profile?.avoid_items ?? [],
      sizes: profile?.sizes ?? {},
    })
      .then((nextProfile) => {
        setProfile(nextProfile);
        syncUser(profileToAuthUser(nextProfile, authUser?.provider), {
          age_range: nextProfile.age_range,
          styles: nextProfile.styles,
        });
        setIsEditing(false);
      })
      .catch(() => {
        setError('프로필 수정 내용을 저장하지 못했어요.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

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
          <Text style={styles.name}>{nickname}님</Text>
          <Text style={styles.meta}>{ageRange}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>{isEditing ? '나이대' : '선호 스타일'}</Text>
        {isEditing ? (
          <View style={styles.tags}>
            {ageOptions.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={draftAge === option}
                onPress={() => setDraftAge(option)}
              />
            ))}
          </View>
        ) : null}
        {isEditing ? <Text style={styles.sectionTitle}>선호 스타일</Text> : null}
        <View style={styles.tags}>
          {isEditing ? (
            styleOptions.map((style) => (
              <Chip
                key={style}
                label={style}
                selected={draftStyles.includes(style)}
                onPress={() => toggleDraftStyle(style)}
              />
            ))
          ) : preferredStyles.length > 0 ? (
            preferredStyles.map((style) => <Chip key={style} label={style} selected />)
          ) : (
            <Text style={styles.meta}>아직 선택된 스타일이 없어요.</Text>
          )}
        </View>
      </AppCard>

      <View style={styles.actions}>
        {isEditing ? (
          <>
            <AppButton title={isSaving ? '저장 중' : '저장'} disabled={isSaving} onPress={saveProfile} />
            <AppButton title="취소" variant="secondary" disabled={isSaving} onPress={cancelEditing} />
          </>
        ) : (
          <AppButton title="수정" variant="secondary" onPress={startEditing} />
        )}
        <AppButton title="로그아웃" variant="ghost" disabled={isSaving} onPress={resetSession} />
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
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});
