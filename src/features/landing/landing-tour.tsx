import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KueColors } from "@/constants/kue-theme";
import { AppBar } from "@/features/landing/components/app-bar";
import { TOUR_SLIDE_COUNT, TourSlide } from "@/features/landing/tour-slides";
import { lightHaptic, selectionHaptic } from "@/lib/haptics";
import { useResponsive } from "@/lib/responsive";

const SLIDES = Array.from({ length: TOUR_SLIDE_COUNT }, (_, index) => index);
const LAST_SLIDE = SLIDES.length - 1;

/**
 * Signed-out onboarding. Every slide is one screen; swiping or the dots move
 * the pager. Returning users can skip straight to the sign-in slide from the
 * header on any slide.
 */
export function LandingTour({
  onSignIn,
  onRegister,
}: {
  onSignIn: () => void;
  onRegister: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useResponsive();
  const listRef = useRef<FlatList<number>>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(LAST_SLIDE, next));
      setIndex(clamped);
      listRef.current?.scrollToOffset({ offset: clamped * width, animated: true });
    },
    [width],
  );

  const startTour = () => {
    lightHaptic();
    goTo(1);
  };

  const skipTour = () => {
    selectionHaptic();
    goTo(LAST_SLIDE);
  };

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.max(
      0,
      Math.min(LAST_SLIDE, Math.round(event.nativeEvent.contentOffset.x / width)),
    );

    if (next !== index) {
      setIndex(next);
      selectionHaptic();
    }
  };

  const isLast = index === LAST_SLIDE;

  return (
    <View style={styles.root}>
      <AppBar action={!isLast ? { label: "Skip", onPress: skipTour } : undefined} />

      <FlatList
        key={`tour-${width}`}
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => String(item)}
        getItemLayout={(_, itemIndex) => ({
          length: width,
          offset: width * itemIndex,
          index: itemIndex,
        })}
        initialScrollIndex={index}
        renderItem={({ item }) => (
          <View style={{ width, alignSelf: "stretch" }}>
            <ScrollView
              style={styles.slideScroll}
              contentContainerStyle={styles.slideContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              bounces={false}
              overScrollMode="never">
              <TourSlide
                index={item}
                onStartTour={startTour}
                onSignIn={onSignIn}
                onRegister={onRegister}
              />
            </ScrollView>
          </View>
        )}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        initialNumToRender={2}
        windowSize={3}
        style={styles.pager}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide) => {
            const active = slide === index;

            return (
              <Pressable
                key={slide}
                onPress={() => {
                  if (!active) selectionHaptic();
                  goTo(slide);
                }}
                hitSlop={16}
                accessibilityRole="button"
                accessibilityLabel={`Go to step ${slide + 1} of ${SLIDES.length}`}
                accessibilityState={{ selected: active }}>
                <View style={[styles.dot, active && styles.dotActive]} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KueColors.background,
  },
  pager: {
    flex: 1,
  },
  slideScroll: {
    flex: 1,
  },
  slideContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    backgroundColor: KueColors.background,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KueColors.line2,
  },
  dotActive: {
    width: 20,
    backgroundColor: KueColors.accent,
  },
});
