import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { fontFamily, fontWeight } from '../../constants/typography';

export function AIRecommendBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>추천</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successSoft,
  },
  text: {
    color: colors.successDark,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
});
