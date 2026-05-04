import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppTextInput } from '../../components/common/AppTextInput';
import { ImageUploadBox } from '../../components/fashion/ImageUploadBox';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import type { RecommendStackParamList } from '../../types/navigation';

type Navigation = NativeStackNavigationProp<RecommendStackParamList, 'StyleRecommend'>;

export function StyleRecommendScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>스타일 추천받기</Text>
      </View>

      <ImageUploadBox title="옷 사진 추가" />

      <View style={styles.promptCard}>
        <AppTextInput
          placeholder="원하는 분위기를 입력하세요"
          multiline
          style={styles.promptInput}
        />
      </View>

      <AppButton
        title="스타일 추천 받기"
        onPress={() =>
          navigation.navigate('RecommendationResult', {
            recommendationId: 'r1',
          })
        }
      />
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
  promptCard: {
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  promptInput: {
    minHeight: 124,
    textAlignVertical: 'top',
    paddingTop: spacing.lg,
  },
});
