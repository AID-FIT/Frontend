import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppCard } from '../../components/common/AppCard';
import { Chip } from '../../components/common/Chip';
import { ImageUploadBox } from '../../components/fashion/ImageUploadBox';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing } from '../../constants/typography';
import { useToggleList } from '../../hooks/useToggleList';
import { pickImageFile, uploadImage } from '../../services/imageService';
import { updateMyPreferences } from '../../services/userService';
import { useAppStore } from '../../store/useAppStore';

const ageOptions = ['10대', '20대', '30대', '40대 이상'];
const styleOptions = ['캐주얼', '미니멀', '스트릿', '포멀', '스포티'];

export function OnboardingScreen() {
  const [age, setAge] = useState('20대');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { values: styles, toggle } = useToggleList(['캐주얼', '미니멀']);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const user = useAppStore((state) => state.user);

  const handleUpload = async () => {
    setError('');
    const file = await pickImageFile();
    if (!file) {
      return;
    }

    setIsSaving(true);
    uploadImage(file)
      .then(() => {
        setUploadedCount((count) => count + 1);
      })
      .catch(() => {
        setError('옷장 사진 업로드에 실패했어요.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleComplete = async () => {
    setError('');
    setIsSaving(true);
    updateMyPreferences({
      age_range: age,
      styles,
    })
      .then(() => {
        completeOnboarding(age, styles);
      })
      .catch(() => {
        setError('온보딩 정보를 저장하지 못했어요.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <ScreenContainer>
      <View style={screenStyles.header}>
        <Text style={screenStyles.title}>{user?.nickname ?? 'AID-FIT 사용자'}님은 어떤 사람인가요?</Text>
      </View>

      <View style={screenStyles.section}>
        <View style={screenStyles.sectionHeader}>
          <Ionicons name="person-outline" size={24} color={colors.primary} />
          <Text style={screenStyles.sectionTitle}>나이대</Text>
        </View>
        <View style={screenStyles.chips}>
          {ageOptions.map((option) => (
            <Chip key={option} label={option} selected={age === option} onPress={() => setAge(option)} />
          ))}
        </View>
      </View>

      <View style={screenStyles.section}>
        <View style={screenStyles.sectionHeader}>
          <Ionicons name="heart-outline" size={24} color={colors.primary} />
          <Text style={screenStyles.sectionTitle}>스타일</Text>
        </View>
        <View style={screenStyles.chips}>
          {styleOptions.map((option) => (
            <Chip key={option} label={option} selected={styles.includes(option)} onPress={() => toggle(option)} />
          ))}
        </View>
      </View>

      <AppCard style={screenStyles.section}>
        <View style={screenStyles.sectionHeader}>
          <Ionicons name="images-outline" size={24} color={colors.primary} />
          <Text style={screenStyles.sectionTitle}>옷장에 어떤 옷이 있나요?</Text>
        </View>
        <View style={screenStyles.uploadGrid}>
          {[0, 1, 2, 3].map((item) => (
            <ImageUploadBox
              key={item}
              compact
              title={item < uploadedCount ? '추가됨' : '사진 추가'}
              disabled={isSaving}
              onPress={handleUpload}
            />
          ))}
        </View>
      </AppCard>

      {error ? <Text style={screenStyles.errorText}>{error}</Text> : null}
      <AppButton title={isSaving ? '저장 중' : '시작하기'} disabled={isSaving} onPress={handleComplete} />
    </ScreenContainer>
  );
}

const screenStyles = StyleSheet.create({
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: letterSpacing.heading,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
    minHeight: 36,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});
