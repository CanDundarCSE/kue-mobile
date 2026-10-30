import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KueColors, KueFonts, KueSpacing } from '@/constants/kue-theme';

/** Temporary destination for tabs that do not have real content yet. */
export function PlaceholderScreen({ kicker, title }: { kicker: string; title: string }) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>Nothing here yet. This screen lands in a later release.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KueColors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: KueSpacing.xl,
    gap: KueSpacing.sm,
  },
  kicker: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: KueColors.foreground,
    fontFamily: KueFonts.serif,
    fontSize: 34,
  },
  body: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 20,
  },
});
