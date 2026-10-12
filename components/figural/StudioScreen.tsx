import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ModelWorkshop } from "./ModelWorkshop";
import { studioColors } from "./StudioControls";

export function StudioScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.mark}><Text style={styles.markText}>3D</Text></View>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>3D4ME / LOCAL 3D STUDIO</Text>
            <Text style={styles.title}>Build and keep your character.</Text>
            <Text style={styles.summary}>Create a genuine editable 3D mesh on this device. No hosted image service, subscription, credits, or paywall are required for the model, views, or GLB export.</Text>
          </View>
        </View>
        <ModelWorkshop />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0C1C" },
  content: { padding: 16, gap: 16, paddingBottom: 38 },
  hero: { flexDirection: "row", alignItems: "flex-start", gap: 13, paddingTop: 8, paddingBottom: 2 },
  mark: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center", backgroundColor: "#8D73F0", borderColor: "#C5B7FF", borderWidth: 1 },
  markText: { color: "#FFF", fontSize: 19, fontWeight: "900", letterSpacing: -1 },
  heroCopy: { flex: 1, gap: 5 },
  kicker: { color: studioColors.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: studioColors.ink, fontSize: 27, fontWeight: "900", letterSpacing: -0.8, lineHeight: 32 },
  summary: { color: studioColors.muted, fontSize: 13, lineHeight: 19 },
});
