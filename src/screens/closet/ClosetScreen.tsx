import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../components/common/AppCard';
import { NoticeBanner } from '../../components/common/NoticeBanner';
import { ClosetGridSkeleton } from '../../components/fashion/ClosetGridSkeleton';
import { ImageUploadBox } from '../../components/fashion/ImageUploadBox';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import {
  analyzePendingImages,
  deleteImage,
  listImages,
  pickImageFile,
  requestAnalysisInBackground,
  uploadImage,
  type UploadedImage,
} from '../../services/imageService';

// 옷장 진입 시 회수 시도 횟수. 무한히 돌지 않도록 묶어둔다.
const MAX_PENDING_ROUNDS = 3;

export function ClosetScreen() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  // 삭제는 되돌릴 수 없으니 타일 안에서 한 번 더 확인받는다.
  // react-native-web에는 Alert가 없어 시스템 확인창은 쓸 수 없다.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  // 업로드 직후의 분석 요청이 도달하지 못한 사진을 옷장에 들어올 때 회수한다.
  // 화면 표시에는 영향이 없으므로 결과를 기다리지도, 오류를 노출하지도 않는다.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 한 번에 다 처리하지 않으므로 남아 있으면 몇 차례 이어서 부른다.
      for (let round = 0; round < MAX_PENDING_ROUNDS; round += 1) {
        try {
          const result = await analyzePendingImages();
          if (cancelled || !result.has_more) {
            return;
          }
        } catch {
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
        // 분석은 업로드와 분리돼 있다. 결과를 기다리지 않고 이어서 태운다.
        requestAnalysisInBackground(uploaded);
      })
      .catch(() => {
        setError('사진 업로드에 실패했어요.');
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  const handleDelete = async (imageId: string) => {
    setError('');
    setPendingDeleteId(null);
    setDeletingId(imageId);

    try {
      await deleteImage(imageId);
      setImages((current) => current.filter((image) => image.id !== imageId));
    } catch {
      setError('사진을 삭제하지 못했어요.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>내 옷장</Text>
      </View>

      <View style={styles.notice}>
        <NoticeBanner
          icon="shirt-outline"
          title="사진 한 장에 옷은 한 벌만 나오게 찍어주세요"
          description="여러 벌이 함께 담기면 옷을 정확히 알아보지 못해요. 한 벌씩 나눠 찍어 올려주세요."
        />
      </View>

      {/* 목록이 있을 때는 빈 상태 카드가 없으므로 오류를 여기서 보여준다. */}
      {error && hasItems ? <Text style={styles.errorText}>{error}</Text> : null}

      {isLoading ? (
        <ClosetGridSkeleton />
      ) : hasItems ? (
        <View style={styles.grid}>
          {images.map((item, index) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemImageWrap}>
                <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover" />

                {pendingDeleteId === item.id ? (
                  <View style={styles.confirm}>
                    <Text style={styles.confirmText}>삭제할까요?</Text>
                    <View style={styles.confirmActions}>
                      <Pressable
                        accessibilityLabel="삭제 취소"
                        onPress={() => setPendingDeleteId(null)}
                        style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.confirmCancelText}>취소</Text>
                      </Pressable>
                      <Pressable
                        accessibilityLabel="삭제 확인"
                        onPress={() => handleDelete(item.id)}
                        style={({ pressed }) => [
                          styles.confirmButton,
                          styles.confirmDanger,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.confirmDangerText}>삭제</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    accessibilityLabel={`옷장 사진 ${images.length - index} 삭제`}
                    disabled={deletingId !== null}
                    onPress={() => setPendingDeleteId(item.id)}
                    style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                  >
                    <Ionicons name="close" size={14} color={colors.white} />
                  </Pressable>
                )}

                {deletingId === item.id ? (
                  <View style={styles.confirm}>
                    <Text style={styles.confirmText}>삭제 중…</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.itemTitle}>옷장 사진 {images.length - index}</Text>
            </View>
          ))}
          <ImageUploadBox compact title={isUploading ? '업로드 중' : '추가'} disabled={isUploading} onPress={handleUpload} />
        </View>
      ) : (
        <AppCard style={styles.empty}>
          <Ionicons name="images-outline" size={42} color={colors.accentTeal} />
          <Text style={styles.emptyTitle}>{error || '비어 있어요'}</Text>
          <ImageUploadBox compact title={isUploading ? '업로드 중' : '사진 추가'} disabled={isUploading} onPress={handleUpload} />
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
  notice: {
    marginBottom: spacing.lg,
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
  itemImageWrap: {
    height: 116,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.navySoft,
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  confirm: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  confirmText: {
    color: colors.white,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  confirmButton: {
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  confirmDanger: {
    backgroundColor: colors.danger,
  },
  confirmCancelText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  confirmDangerText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
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
