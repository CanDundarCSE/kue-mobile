import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { KueColors } from "@/constants/kue-theme";
import { MEDIA_TYPE_META, type MediaType } from "@/features/landing/data";

const SIZES = {
  sm: { width: 34, height: 44 },
  md: { width: 42, height: 54 },
  lg: { width: 72, height: 96 },
} as const;

export type MediaAvatarSize = keyof typeof SIZES;

function getInitials(title: string) {
  const words = title.split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";
}

/** Poster-or-initials card with a media-coloured spine, like the web component. */
export function MediaAvatarCard({
  title,
  year,
  image,
  type,
  size = "md",
}: {
  title: string;
  year?: number;
  image?: string;
  type: MediaType;
  size?: MediaAvatarSize;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(image) && !failed;
  const dimensions = SIZES[size];
  const accent = MEDIA_TYPE_META[type].color;

  return (
    <View
      style={[
        styles.card,
        { width: dimensions.width, height: dimensions.height, borderLeftColor: accent },
      ]}
      accessibilityRole="image"
      accessibilityLabel={year === undefined ? title : `${title} (${year})`}>
      {showImage ? (
        <Image
          source={{ uri: image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.initials} numberOfLines={1}>
            {getInitials(title)}
          </Text>
          {size !== "sm" && year !== undefined ? (
            <Text style={styles.year}>{year}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.surface3,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  fallback: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  initials: {
    fontSize: 13,
    fontWeight: "700",
    color: KueColors.foreground,
    letterSpacing: 0.2,
  },
  year: {
    fontSize: 9,
    color: KueColors.ink3,
  },
});
