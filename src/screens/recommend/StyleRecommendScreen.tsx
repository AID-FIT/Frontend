import { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppTextInput } from '../../components/common/AppTextInput';
import { NoticeBanner } from '../../components/common/NoticeBanner';
import { ImageUploadBox } from '../../components/fashion/ImageUploadBox';
import { SelectedImageGrid } from '../../components/fashion/SelectedImageGrid';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { getImageFingerprint, pickImageFiles, uploadImage } from '../../services/imageService';
import { createRecommendation } from '../../services/recommendationService';
import { useAppStore } from '../../store/useAppStore';
import type { RecommendStackParamList } from '../../types/navigation';

type Navigation = NativeStackNavigationProp<RecommendStackParamList, 'StyleRecommend'>;

const MAX_IMAGES = 8;

export function StyleRecommendScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAppStore((state) => state.user);
  const selectedAge = useAppStore((state) => state.selectedAge);
  const preferredStyles = useAppStore((state) => state.preferredStyles);
  const [prompt, setPrompt] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  // imageUrls와 같은 순서로 유지되는 내용 지문 목록.
  const [selectedFingerprints, setSelectedFingerprints] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasImages = imageUrls.length > 0;
  const isUploading = uploadingCount > 0;
  const isBusy = isUploading || isSubmitting;

  const handlePickImages = async () => {
    setError('');
    const files = await pickImageFiles();
    if (files.length === 0) {
      return;
    }

    const remainingSlots = MAX_IMAGES - imageUrls.length;
    if (remainingSlots <= 0) {
      setError(`사진은 최대 ${MAX_IMAGES}장까지 추가할 수 있어요.`);
      return;
    }

    // 업로드 전에 내용 지문으로 중복을 걸러낸다.
    // 이미 고른 사진, 그리고 이번에 한꺼번에 고른 것들 사이의 중복까지 본다.
    const fingerprints = await Promise.all(files.map((file) => getImageFingerprint(file)));
    const seen = new Set(selectedFingerprints);
    const unique: { file: File; fingerprint: string }[] = [];
    let duplicateCount = 0;

    files.forEach((file, index) => {
      const fingerprint = fingerprints[index];
      if (seen.has(fingerprint)) {
        duplicateCount += 1;
        return;
      }
      seen.add(fingerprint);
      unique.push({ file, fingerprint });
    });

    if (unique.length === 0) {
      setError('이미 같은 이미지가 업로드 되어 있습니다!');
      return;
    }

    const accepted = unique.slice(0, remainingSlots);

    if (duplicateCount > 0) {
      setError(`이미 같은 이미지가 업로드 되어 있습니다! (${duplicateCount}장 제외)`);
    } else if (accepted.length < unique.length) {
      setError(`사진은 최대 ${MAX_IMAGES}장까지라 ${accepted.length}장만 추가했어요.`);
    }

    setUploadingCount((count) => count + accepted.length);

    // 한 장이 실패해도 나머지는 살리려고 allSettled로 각각 처리한다.
    const results = await Promise.allSettled(accepted.map(({ file }) => uploadImage(file)));
    const uploaded: string[] = [];
    const uploadedFingerprints: string[] = [];

    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') {
        return;
      }
      // 백엔드도 내용 해시로 경로를 정하므로, 지문이 달라도 같은 URL이 올 수 있다.
      const { image_url: url } = result.value;
      if (uploaded.includes(url) || imageUrls.includes(url)) {
        return;
      }
      uploaded.push(url);
      uploadedFingerprints.push(accepted[index].fingerprint);
    });

    const failedCount = results.filter((result) => result.status === 'rejected').length;

    setImageUrls((current) => [...current, ...uploaded]);
    setSelectedFingerprints((current) => [...current, ...uploadedFingerprints]);
    setUploadingCount((count) => Math.max(0, count - accepted.length));

    if (failedCount > 0) {
      setError(
        uploaded.length > 0
          ? `${failedCount}장은 업로드하지 못했어요.`
          : '이미지 업로드에 실패했어요.',
      );
    }
  };

  const handleRemoveImage = (target: string) => {
    setError('');
    const index = imageUrls.indexOf(target);
    if (index === -1) {
      return;
    }
    setImageUrls((current) => current.filter((imageUrl) => imageUrl !== target));
    setSelectedFingerprints((current) => current.filter((_, i) => i !== index));
  };

  const handleRecommend = () => {
    setError('');

    if (!user?.id) {
      setError('로그인 후 추천을 받을 수 있어요.');
      return;
    }

    if (!hasImages) {
      setError('먼저 옷 사진을 추가해 주세요.');
      return;
    }

    setIsSubmitting(true);
    createRecommendation({
      user_id: user.id,
      query: prompt || '내 스타일에 어울리는 데일리 코디를 추천해줘',
      image_urls: imageUrls,
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
        setIsSubmitting(false);
      });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>스타일 추천받기</Text>
      </View>

      <NoticeBanner
        icon="shirt-outline"
        title="사진 한 장에 옷은 한 벌만 나오게 찍어주세요"
        description={`여러 벌이 함께 담기면 옷을 정확히 알아보지 못해요. 여러 벌을 올리고 싶다면 한 벌씩 나눠 찍어 최대 ${MAX_IMAGES}장까지 추가할 수 있어요.`}
      />

      <View style={styles.uploadSection}>
        {hasImages || isUploading ? (
          <SelectedImageGrid
            imageUrls={imageUrls}
            pendingCount={uploadingCount}
            disabled={isBusy}
            onAdd={handlePickImages}
            onRemove={handleRemoveImage}
          />
        ) : (
          <ImageUploadBox
            title="옷 사진 추가"
            description="한 벌씩 찍은 사진을 여러 장 올릴 수 있어요"
            disabled={isBusy}
            onPress={handlePickImages}
          />
        )}
        {hasImages ? (
          <Text style={styles.countText}>
            {imageUrls.length}장 선택됨{isUploading ? ` · ${uploadingCount}장 업로드 중` : ''}
          </Text>
        ) : null}
      </View>

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
        title={isUploading ? '업로드 중' : isSubmitting ? '추천 만드는 중' : '스타일 추천 받기'}
        disabled={isBusy}
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
  uploadSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  countText: {
    color: colors.subText,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
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
