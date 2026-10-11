import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StudioSection, studioColors } from "./StudioControls";

export function SafetyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>FIGURAL STANDARD</Text>
          <Text style={styles.title}>Adult-only creation with clear provenance.</Text>
          <Text style={styles.summary}>
            Figural creates fictional adult character references and keeps the creator accountable for consent and usage rights.
          </Text>
        </View>

        <StudioSection eyebrow="Hard stop" title="What Figural will not process">
          <Text style={styles.body}>• Minors or subjects with an ambiguous/youthful presentation.</Text>
          <Text style={styles.body}>• Non-consensual scenarios or sexualized replicas of identifiable people.</Text>
          <Text style={styles.body}>• A reference image without creator-held rights or subject consent.</Text>
        </StudioSection>

        <StudioSection eyebrow="Before each render" title="Creator attestations">
          <Text style={styles.body}>Every render requires confirmation that the character is fictional, adult (21+), and created with the necessary rights and consent.</Text>
          <Text style={styles.body}>Reference images are sent only with their specific attestations and are not retained as a project image.</Text>
        </StudioSection>

        <StudioSection eyebrow="Before export" title="Provenance receipt">
          <Text style={styles.body}>Exports require a fresh rights confirmation. You can include a JSON provenance sidecar describing the fictional-adult attestation, view, render time, and transparency verification.</Text>
        </StudioSection>

        <View style={styles.freeNote}>
          <Text style={styles.freeTitle}>Free for creators</Text>
          <Text style={styles.freeText}>No subscriptions, credits, in-app purchases, or paid API key field are presented in this app.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0C1C" },
  content: { padding: 18, gap: 16, paddingBottom: 36 },
  hero: { gap: 9, paddingTop: 8, paddingBottom: 4 },
  kicker: { color: studioColors.mint, fontWeight: "900", letterSpacing: 1.4, fontSize: 11 },
  title: { color: studioColors.ink, fontSize: 30, lineHeight: 35, fontWeight: "900", letterSpacing: -0.7 },
  summary: { color: studioColors.muted, fontSize: 15, lineHeight: 22 },
  body: { color: studioColors.muted, fontSize: 14, lineHeight: 21 },
  freeNote: { backgroundColor: "#20352E", borderColor: "#4A8372", borderWidth: 1, padding: 18, borderRadius: 22, gap: 5 },
  freeTitle: { color: studioColors.mint, fontWeight: "900", fontSize: 16 },
  freeText: { color: "#D2F2E3", fontSize: 13, lineHeight: 19 },
});
