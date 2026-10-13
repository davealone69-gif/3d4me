import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ModelWorkshop } from "./ModelWorkshop";

/**
 * Keep native startup independent from the GL renderer. The title screen is
 * rendered first; the editor is mounted only after the user explicitly opens it.
 */
export function StudioScreen() {
  const [studioOpen, setStudioOpen] = useState(false);

  if (studioOpen) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "right", "bottom", "left"]}>
        <View style={styles.editorHeader}>
          <Text style={styles.editorBrand}>3D4ME · LOCAL 3D STUDIO</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to title screen"
            onPress={() => setStudioOpen(false)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Title screen</Text>
          </Pressable>
        </View>
        <ScrollView
          style={styles.editorScroll}
          contentContainerStyle={styles.editorContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <ModelWorkshop />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "right", "bottom", "left"]}>
      <View style={styles.content} accessibilityRole="summary">
        <View style={styles.mark}>
          <Text style={styles.markText}>3D</Text>
        </View>
        <Text style={styles.title}>3D4ME</Text>
        <Text style={styles.subtitle}>LOCAL 3D STUDIO</Text>
        <Text style={styles.description}>
          Build and customise a fictional 3D character on this device.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open 3D character studio"
          onPress={() => setStudioOpen(true)}
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
        >
          <Text style={styles.startButtonText}>Open Studio</Text>
        </Pressable>
        <Text style={styles.footer}>Your projects stay on this device.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0C1C" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  mark: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#8D73F0",
    borderColor: "#C5B7FF",
    borderWidth: 1,
    marginBottom: 22,
  },
  markText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  subtitle: {
    color: "#B7A3FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
    marginTop: 10,
  },
  description: {
    color: "#C4BED8",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 24,
    maxWidth: 290,
  },
  startButton: {
    minWidth: 210,
    marginTop: 26,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#8D73F0",
    borderColor: "#C5B7FF",
    borderWidth: 1,
  },
  startButtonPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  startButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  footer: { color: "#8F87AA", fontSize: 11, marginTop: 18 },
  editorHeader: {
    minHeight: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#332B4B",
  },
  editorBrand: { color: "#C4B5FD", fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  backButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#2A2449",
    borderColor: "#6755A5",
    borderWidth: 1,
  },
  backButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  editorScroll: { flex: 1 },
  editorContent: { padding: 16, paddingBottom: 36, gap: 16 },
});
