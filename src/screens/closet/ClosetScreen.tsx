import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../components/common/AppCard';
import { ImageUploadBox } from '../../components/fashion/ImageUploadBox';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { mockClosetImages } from '../../mocks/closet';

export function ClosetScreen() {
  const hasItems = mockClosetImages.length > 0;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>내 옷장</Text>
      </View>

      {hasItems ? (
        <View style={styles.grid}>
          {mockClosetImages.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={[styles.itemImage, { backgroundColor: item.tone }]}>
                <Ionicons name="shirt-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
            </View>
          ))}
          <ImageUploadBox compact title="추가" />
        </View>
      ) : (
        <AppCard style={styles.empty}>
          <Ionicons name="images-outline" size={42} color={colors.accentTeal} />
          <Text style={styles.emptyTitle}>비어 있어요</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
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
