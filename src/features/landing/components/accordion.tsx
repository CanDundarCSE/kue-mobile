import { ChevronDown } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { KueColors } from "@/constants/kue-theme";

export type FaqItem = {
  question: string;
  answer: string;
};

function FaqRow({
  item,
  open,
  onToggle,
  divider,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
  divider: boolean;
}) {
  const rotation = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(open ? 1 : 0, { duration: 200 });
  }, [open, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <View style={divider && styles.divider}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}>
        <Text style={styles.question}>{item.question}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown
            size={19}
            color={open ? KueColors.accent : KueColors.ink3}
            strokeWidth={2}
          />
        </Animated.View>
      </Pressable>

      {open ? (
        <Animated.View layout={LinearTransition.duration(220)}>
          <Text style={styles.answer}>{item.answer}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function FaqList({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Animated.View layout={LinearTransition.duration(220)} style={styles.card}>
      {items.map((item, index) => (
        <FaqRow
          key={item.question}
          item={item}
          open={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          divider={index > 0}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    borderRadius: 24,
    backgroundColor: KueColors.surface2,
    overflow: "hidden",
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KueColors.line,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  question: {
    flex: 1,
    color: KueColors.foreground,
    fontSize: 15.5,
    fontWeight: "600",
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  answer: {
    color: KueColors.ink2,
    fontSize: 14,
    lineHeight: 21.5,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
});
