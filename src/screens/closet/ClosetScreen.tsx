import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../components/common/AppCard';
import { ImageUploadBox } from '../../components/fashion/ImageUploadBox';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { listImages, pickImageFile, uploadImage, type UploadedImage } from '../../services/imageService';

export function ClosetScreen() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const hasItems = images.length > 0;

  const loadImages = useCallback(() => {
    setIsLoading(true);
    setError('');
    listImages()
      .then(setImages)
      .catch(() => {
        setError('옷장 사진을 불러오지 못했어요.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleUpload = async () => {
    setError('');
    const file = await pickImageFile();
    if (!file) {
      return;
    }

    setIsUploading(true);
    uploadImage(file)
      .then((uploaded) => {
        setImages((current) => [uploaded, ...current]);
      })
      .catch(() => {
        setError('사진 업로드에 실패했어요.');
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>내 옷장</Text>
      </View>

      {hasItems ? (
        <View style={styles.grid}>
          {images.map((item, index) => (
            <View key={item.id} style={styles.item}>
              <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover" />
              <Text style={styles.itemTitle}>옷장 사진 {images.length - index}</Text>
            </View>
          ))}
          <ImageUploadBox compact title={isUploading ? '업로드 중' : '추가'} disabled={isUploading} onPress={handleUpload} />
        </View>
      ) : (
        <AppCard style={styles.empty}>
          <Ionicons name="images-outline" size={42} color={colors.accentTeal} />
          <Text style={styles.emptyTitle}>
            {isLoading ? '불러오는 중이에요' : error || '비어 있어요'}
          </Text>
          {!isLoading ? (
            <ImageUploadBox compact title={isUploading ? '업로드 중' : '사진 추가'} disabled={isUploading} onPress={handleUpload} />
          ) : null}
        </AppCard>
      )}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  item: {
    width: '47.8%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    height: 116,
    borderRadius: radius.md,
    backgroundColor: colors.navySoft,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.huge,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
});
