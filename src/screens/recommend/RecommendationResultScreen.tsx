import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../components/common/AppCard';
import { Chip } from '../../components/common/Chip';
import { AIRecommendBadge } from '../../components/fashion/AIRecommendBadge';
import { OutfitCard } from '../../components/fashion/OutfitCard';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight, letterSpacing, typography } from '../../constants/typography';
import { mockRecommendations } from '../../mocks/recommendations';
import type { RecommendStackParamList } from '../../types/navigation';

type ResultRoute = RouteProp<RecommendStackParamList, 'RecommendationResult'>;

export function RecommendationResultScreen() {
  const route = useRoute<ResultRoute>();
  const recommendation =
    mockRecommendations.find((item) => item.id === route.params.recommendationId) ??
    mockRecommendations[0];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AIRecommendBadge />
        <Text style={styles.title}>{recommendation.title}</Text>
        <View style={styles.tags}>
          {recommendation.tags.map((tag) => (
            <Chip key={tag} label={tag} selected />
          ))}
        </View>
      </View>

      <View style={styles.outfits}>
        {recommendation.items.map((item) => (
          <OutfitCard key={item.id} item={item} />
        ))}
      </View>

      <AppCard style={styles.explainCard}>
        <Text style={styles.explainTitle}>메모</Text>
        <Text style={styles.explainText}>{recommendation.summary}</Text>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    lineHeight: 44,
    letterSpacing: letterSpacing.heading,
    fontFamily: fontFamily.heavy,
    fontWeight: fontWeight.heavy,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  outfits: {
    gap: spacing.md,
  },
  explainCard: {
    marginTop: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.primary,
  },
  explainTitle: {
    color: colors.white,
    fontSize: 20,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  explainText: {
    color: colors.bodyDark,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});
