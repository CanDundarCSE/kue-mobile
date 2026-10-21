import { useRef, type ComponentRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KueColors } from "@/constants/kue-theme";
import { AppBar } from "@/features/landing/components/app-bar";
import {
  EndSection,
  FaqSection,
  FeaturesSection,
  FormatsSection,
  HeroSection,
  LibrarySection,
  YearSection,
} from "@/features/landing/sections";
import { useResponsive } from "@/lib/responsive";

const MAX_PAGE_WIDTH = 620;

export function LandingScreen({ onSignIn }: { onSignIn: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useResponsive();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const libraryY = useRef(0);

  const availableWidth = width - insets.left - insets.right - 32;
  const pageWidth = Math.min(Math.max(availableWidth, 272), MAX_PAGE_WIDTH);
  const pageGutter = Math.max(16, (width - pageWidth) / 2);

  const scrollToLibrary = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, libraryY.current), animated: true });
  };

  return (
    <View style={styles.root}>
      <AppBar onSignIn={onSignIn} pageWidth={pageWidth} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={{ width: pageWidth, alignSelf: "center" }}>
          <HeroSection onSignIn={onSignIn} onExplore={scrollToLibrary} />

          <View
            onLayout={(event) => {
              libraryY.current = event.nativeEvent.layout.y;
            }}>
            <LibrarySection />
          </View>

          <FormatsSection pageGutter={pageGutter} />
          <FeaturesSection />
          <YearSection />
          <FaqSection />
          <EndSection onSignIn={onSignIn} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KueColors.background,
  },
  scroll: {
    flex: 1,
  },
});
