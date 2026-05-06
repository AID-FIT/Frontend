import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';
import type { OutfitItem } from '../../types/fashion';

type OutfitCardProps = {
  item: OutfitItem;
};

export function OutfitCard({ item }: OutfitCardProps) {
  return (
    <View style={styles.card}>
      {item.product?.imageUrl ? (
        <Image source={{ uri: item.product.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, { backgroundColor: item.imageTone }]}>
          <Ionicons name="shirt-outline" size={28} color={colors.primary} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.reason}>{item.reason}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: 82,
    height: 82,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  category: {
    color: colors.accentTeal,
    fontSize: 14,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  reason: {
    color: colors.subText,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});
