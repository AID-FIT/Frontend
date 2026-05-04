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
import { mockUser } from '../../mocks/user';
import { useAppStore } from '../../store/useAppStore';

const ageOptions = ['10대', '20대', '30대', '40대 이상'];
const styleOptions = ['캐주얼', '미니멀', '스트릿', '포멀', '스포티'];

export function OnboardingScreen() {
  const [age, setAge] = useState('20대');
  const { values: styles, toggle } = useToggleList(['캐주얼', '미니멀']);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  return (
    <ScreenContainer>
      <View style={screenStyles.header}>
        <Text style={screenStyles.title}>{mockUser.name}님은 어떤 사람인가요?</Text>
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
            <ImageUploadBox key={item} compact title="사진 추가" />
          ))}
        </View>
      </AppCard>

      <AppButton title="시작하기" onPress={() => completeOnboarding(age, styles)} />
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
});
