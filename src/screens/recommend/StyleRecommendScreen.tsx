import { useState } from 'react';
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
import { pickImageFile, uploadImage } from '../../services/imageService';
import { createRecommendation } from '../../services/recommendationService';
import { useAppStore } from '../../store/useAppStore';
import type { RecommendStackParamList } from '../../types/navigation';

type Navigation = NativeStackNavigationProp<RecommendStackParamList, 'StyleRecommend'>;

export function StyleRecommendScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAppStore((state) => state.user);
  const selectedAge = useAppStore((state) => state.selectedAge);
  const preferredStyles = useAppStore((state) => state.preferredStyles);
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePickImage = async () => {
    setError('');
    const file = await pickImageFile();
    if (!file) {
      return;
    }

    setIsLoading(true);
    uploadImage(file)
      .then((uploaded) => {
        setImageUrl(uploaded.image_url);
      })
      .catch(() => {
        setError('이미지 업로드에 실패했어요.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleRecommend = () => {
    setError('');

    if (!user?.id) {
      setError('로그인 후 추천을 받을 수 있어요.');
      return;
    }

    if (!imageUrl) {
      setError('먼저 옷 사진을 추가해 주세요.');
      return;
    }

    setIsLoading(true);
    createRecommendation({
      user_id: user.id,
      query: prompt || '내 스타일에 어울리는 데일리 코디를 추천해줘',
      image_urls: imageUrl ? [imageUrl] : [],
      closet_items: [],
      use_closet_style: true,
      user_profile: {
        age_group: selectedAge || null,
        preferred_styles: preferredStyles,
      },
    })
      .then((recommendation) => {
        navigation.navigate('RecommendationResult', {
          recommendationId: recommendation.id,
          recommendation,
        });
      })
      .catch(() => {
        setError('추천 생성에 실패했어요.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>스타일 추천받기</Text>
      </View>

      <ImageUploadBox
        title={imageUrl ? '사진 추가 완료' : '옷 사진 추가'}
        description={imageUrl ? '추천에 사용할 사진이 준비됐어요' : '옷 사진을 올려주세요'}
        disabled={isLoading}
        onPress={handlePickImage}
      />

      <View style={styles.promptCard}>
        <AppTextInput
          placeholder="원하는 분위기를 입력하세요"
          value={prompt}
          onChangeText={setPrompt}
          multiline
          style={styles.promptInput}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <AppButton
        title={isLoading ? '처리 중' : '스타일 추천 받기'}
        disabled={isLoading}
        onPress={handleRecommend}
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
