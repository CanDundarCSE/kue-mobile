import { useEffect, useState } from "react";
import { Animated, Text, type StyleProp, type TextStyle } from "react-native";

const DURATION = 900;

/**
 * Animated number that eases up to `value` on mount. Mirrors the web
 * `CountUp`, minus the IntersectionObserver (the landing scroll is short
 * enough that animating on mount reads the same).
 */
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  style,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = progress.addListener(({ value: next }) => {
      setDisplay(next);
    });

    Animated.timing(progress, {
      toValue: value,
      duration: DURATION,
      useNativeDriver: false,
    }).start();

    return () => progress.removeListener(id);
  }, [progress, value]);

  const rendered =
    decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString("en-US");

  return (
    <Text style={style}>
      {rendered}
      {suffix}
    </Text>
  );
}
