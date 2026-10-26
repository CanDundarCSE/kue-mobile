import { X } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KueColors, KueFonts, KueTextScale } from "@/constants/kue-theme";
import {
  LEGAL_DOCUMENTS,
  type LegalDocumentKey,
  type LegalSection,
} from "@/features/legal/legal-content";

/**
 * In-app legal document viewer. Renders the same content module the web app
 * uses (src/features/legal/legal-content.ts), so mobile never drifts from web.
 */
export function LegalSheet({
  documentKey,
  onClose,
}: {
  documentKey: LegalDocumentKey | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const document = documentKey ? LEGAL_DOCUMENTS[documentKey] : null;

  return (
    <Modal
      visible={document != null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close document"
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.grabber} />

          {document ? (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {document.title}
                  <Text style={styles.accent}>.</Text>
                </Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  style={({ pressed }) => [styles.close, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Close ${document.title}`}>
                  <X size={20} color={KueColors.ink2} strokeWidth={2} />
                </Pressable>
              </View>

              <Text style={styles.updated}>Last updated {document.lastUpdated}</Text>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}>
                <Text style={styles.intro}>{document.intro}</Text>

                {document.sections.map((section) => (
                  <LegalSectionView key={section.heading} section={section} />
                ))}
              </ScrollView>
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LegalSectionView({ section }: { section: LegalSection }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{section.heading}</Text>

      {section.paragraphs?.map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}

      {section.bullets?.map((bullet, index) => (
        <View key={index} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}

      {section.table ? (
        <View style={styles.table}>
          {section.table.rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={[styles.tableCard, rowIndex < section.table!.rows.length - 1 && styles.tableCardLine]}>
              {row.map((cell, cellIndex) => (
                <View key={cellIndex} style={styles.tableCardRow}>
                  <Text
                    maxFontSizeMultiplier={KueTextScale.compact}
                    style={styles.tableCardLabel}>
                    {section.table!.headers[cellIndex] ?? ""}
                  </Text>
                  <Text style={styles.tableCardValue}>{cell}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.64)",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: KueColors.surface2,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: KueColors.line2,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    flex: 1,
    color: KueColors.foreground,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  accent: {
    color: KueColors.accent,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KueColors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  updated: {
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 4,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollInner: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  intro: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    marginTop: 22,
  },
  heading: {
    color: KueColors.foreground,
    fontFamily: KueFonts.sansSemiBold,
    fontSize: 15.5,
    marginBottom: 8,
  },
  paragraph: {
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 7,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: KueColors.accent,
    marginTop: 7.5,
  },
  bulletText: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  tableCard: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 4,
  },
  tableCardLine: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KueColors.line,
  },
  tableCardRow: {
    flexDirection: "row",
    gap: 8,
  },
  tableCardLabel: {
    width: 88,
    color: KueColors.ink3,
    fontFamily: KueFonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 2,
  },
  tableCardValue: {
    flex: 1,
    color: KueColors.ink2,
    fontFamily: KueFonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
});
