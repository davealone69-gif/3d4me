import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Minimal Android launch/title screen.
 *
 * Keep the first route independent from the 3D renderer and editor so that
 * native startup can be verified separately from GL/model initialization.
 * Do not mount the editor here until title-screen launch is confirmed on-device.
 */
export function StudioScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "right", "bottom", "left"]}>
      <View style={styles.content} accessibilityRole="summary">
        <View style={styles.mark}>
          <Text style={styles.markText}>3D</Text>
        </View>
        <Text style={styles.title}>3D4ME</Text>
        <Text style={styles.subtitle}>LOCAL 3D STUDIO</Text>
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
});
