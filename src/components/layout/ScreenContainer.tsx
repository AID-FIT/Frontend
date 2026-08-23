import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { layout } from '../../constants/layout';
import { spacing } from '../../constants/spacing';

type ScreenContainerProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
};

export function ScreenContainer({
  children,
  scroll = true,
  padded = true,
}: ScreenContainerProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, styles.fixedContent]}>
          <View style={[styles.column, styles.fixedColumn, padded && styles.padded]}>{children}</View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.column, styles.scrollColumn, padded && styles.padded]}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
  },
  fixedContent: {
    flex: 1,
    minHeight: 0,
  },
  // 넓은 화면에서도 내용을 가운데 고정 폭 안에 담는다.
  column: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  fixedColumn: {
    flex: 1,
    minHeight: 0,
  },
  scrollColumn: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});
