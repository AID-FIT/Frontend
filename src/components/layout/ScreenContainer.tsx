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
  /** 사이드바가 있는 화면처럼 더 넓은 폭이 필요할 때만 지정한다. */
  maxWidth?: number;
};

export function ScreenContainer({
  children,
  scroll = true,
  padded = true,
  maxWidth = layout.maxContentWidth,
}: ScreenContainerProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, styles.fixedContent]}>
          <View style={[styles.column, { maxWidth }, styles.fixedColumn, padded && styles.padded]}>
            {children}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.column, { maxWidth }, styles.scrollColumn, padded && styles.padded]}>
          {children}
        </View>
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
