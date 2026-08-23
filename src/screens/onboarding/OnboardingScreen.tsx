import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppCard } from '../../components/common/AppCard';
import { Chip } from '../../components/common/Chip';
import { NoticeBanner } from '../../components/common/NoticeBanner';
import { ImageUploadBox } from '../../components/fashion/ImageUploadBox';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing } from '../../constants/typography';
import { useToggleList } from '../../hooks/useToggleList';
import {
  getImageFingerprint,
  pickImageFile,
  requestAnalysisInBackground,
  uploadImage,
  type UploadedImage,
} from '../../services/imageService';
import { completeOnboarding as completeOnboardingRequest } from '../../services/userService';
import { useAppStore } from '../../store/useAppStore';

const ageOptions = ['10대', '20대', '30대', '40대 이상'];
const styleOptions = ['캐주얼', '미니멀', '스트릿', '포멀', '스포티'];
const MAX_CLOSET_IMAGES = 4;

export function OnboardingScreen() {
  const [age, setAge] = useState('20대');
  // id만 들고 있으면 썸네일을 그릴 수 없어 업로드 결과를 통째로 보관한다.
  const [closetImages, setClosetImages] = useState<UploadedImage[]>([]);
  // closetImages와 같은 순서로 유지되는 내용 지문 목록.
  const [fingerprints, setFingerprints] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { values: styles, toggle } = useToggleList(['캐주얼', '미니멀']);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const user = useAppStore((state) => state.user);

  const handleUpload = async () => {
    setError('');
    if (closetImages.length >= MAX_CLOSET_IMAGES) {
      setError(`사진은 최대 ${MAX_CLOSET_IMAGES}장까지 올릴 수 있어요.`);
      return;
    }

    const file = await pickImageFile();
    if (!file) {
      return;
    }

    // 업로드 전에 내용 지문으로 같은 사진인지 먼저 본다.
    const fingerprint = await getImageFingerprint(file);
    if (fingerprints.includes(fingerprint)) {
      setError('이미 같은 이미지가 업로드 되어 있습니다!');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadImage(file);
      // 백엔드도 내용 해시로 경로를 정하므로 지문이 달라도 같은 id가 올 수 있다.
      if (closetImages.some((image) => image.id === uploaded.id)) {
        setError('이미 같은 이미지가 업로드 되어 있습니다!');
        return;
      }

      setClosetImages((current) => [...current, uploaded]);
      setFingerprints((current) => [...current, fingerprint]);
      // 분석은 업로드와 분리돼 있다. 결과를 기다리지 않고 이어서 태운다.
      requestAnalysisInBackground(uploaded);
    } catch {
      setError('옷장 사진 업로드에 실패했어요.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (imageId: string) => {
    setError('');
    const index = closetImages.findIndex((image) => image.id === imageId);
    if (index === -1) {
      return;
    }
    setClosetImages((current) => current.filter((image) => image.id !== imageId));
    setFingerprints((current) => current.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    setError('');
    setIsSaving(true);
    completeOnboardingRequest({
      age_range: age,
      styles,
      closet_image_ids: closetImages.map((image) => image.id),
    })
      .then((profile) => {
        completeOnboarding(age, styles, user ? { ...user, role: profile.role } : null);
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

        <NoticeBanner
          icon="shirt-outline"
          title="사진 한 장에 옷은 한 벌만 나오게 찍어주세요"
          description={`여러 벌이 함께 담기면 옷을 정확히 알아보지 못해요. 한 벌씩 나눠 찍어 최대 ${MAX_CLOSET_IMAGES}장까지 올릴 수 있어요.`}
        />

        <View style={screenStyles.uploadGrid}>
          {closetImages.map((image) => (
            <View key={image.id} style={screenStyles.slot}>
              <Image source={{ uri: image.image_url }} style={screenStyles.thumb} resizeMode="cover" />
              <Pressable
                accessibilityLabel="사진 삭제"
                disabled={isSaving}
                onPress={() => handleRemove(image.id)}
                style={({ pressed }) => [screenStyles.remove, pressed && screenStyles.pressed]}
              >
                <Ionicons name="close" size={12} color={colors.white} />
              </Pressable>
            </View>
          ))}

          {closetImages.length < MAX_CLOSET_IMAGES ? (
            <View style={screenStyles.slot}>
              <ImageUploadBox
                compact
                title={isUploading ? '업로드 중' : '사진 추가'}
                disabled={isUploading || isSaving}
                onPress={handleUpload}
              />
            </View>
          ) : null}
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
  // ImageUploadBox(compact)는 flex:1이라 고정 폭 슬롯 안에 담아 크기를 맞춘다.
  slot: {
    width: 96,
    height: 102,
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
  },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
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
