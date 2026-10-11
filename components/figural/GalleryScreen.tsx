import { useState } from "react";
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOwnerToken } from "@/hooks/use-owner-token";
import { trpc } from "@/lib/trpc";
import { RenderGrid, type GalleryRender } from "./RenderGrid";
import { AttestationRow, studioColors } from "./StudioControls";

export function GalleryScreen() {
  const { ownerToken, ready } = useOwnerToken();
  const rendersQuery = trpc.character.listRenders.useQuery(
    { ownerToken: ownerToken ?? "" },
    { enabled: Boolean(ownerToken) },
  );
  const exportMutation = trpc.character.prepareExport.useMutation();
  const [selectedRender, setSelectedRender] = useState<GalleryRender | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [provenanceIncluded, setProvenanceIncluded] = useState(true);

  const completeRenders = (rendersQuery.data ?? []) as GalleryRender[];

  const beginExport = (render: GalleryRender) => {
    setSelectedRender(render);
    setRightsConfirmed(false);
    setProvenanceIncluded(true);
  };

  const exportRender = async () => {
    if (!ownerToken || !selectedRender || !rightsConfirmed) return;
    try {
      const result = await exportMutation.mutateAsync({
        ownerToken,
        renderId: selectedRender.id,
        rightsConfirmed: true,
        provenanceIncluded,
      });
      await Linking.openURL(result.downloadUrl);
      if (result.provenanceUrl && provenanceIncluded) {
        Alert.alert("Original render opened", "The optional provenance receipt is ready from the export panel.", [
          { text: "Open receipt", onPress: () => void Linking.openURL(result.provenanceUrl!) },
          { text: "Done", style: "cancel" },
        ]);
      }
      setSelectedRender(null);
    } catch (error) {
      Alert.alert("Export unavailable", error instanceof Error ? error.message : "Try again after checking the render status.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>COMPLETED WORK</Text>
          <Text style={styles.title}>Render gallery</Text>
          <Text style={styles.summary}>Review only real completed outputs. A source-resolution download is enabled only after export rights confirmation.</Text>
        </View>
        {!ready || rendersQuery.isLoading ? <Text style={styles.loading}>Loading your device’s project gallery…</Text> : null}
        {rendersQuery.error ? <Text style={styles.error}>{rendersQuery.error.message}</Text> : null}
        {ready && !rendersQuery.isLoading ? <RenderGrid renders={completeRenders} onExport={beginExport} /> : null}
      </ScrollView>

      <Modal visible={Boolean(selectedRender)} transparent animationType="slide" onRequestClose={() => setSelectedRender(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalKicker}>EXPORT GATE</Text>
            <Text style={styles.modalTitle}>Confirm rights before download</Text>
            <Text style={styles.modalBody}>This opens the original completed render through a short-lived signed download link. No download is simulated.</Text>
            <AttestationRow
              value={rightsConfirmed}
              onChange={setRightsConfirmed}
              label="I confirm I have the rights and consent required for this export and intended use."
            />
            <AttestationRow
              value={provenanceIncluded}
              onChange={setProvenanceIncluded}
              label="Include a provenance JSON sidecar with this export."
              detail="The receipt records the fictional-adult attestation, render view, time, and transparency result."
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSelectedRender(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable onPress={() => void exportRender()} disabled={!rightsConfirmed || exportMutation.isPending} style={[styles.confirmButton, (!rightsConfirmed || exportMutation.isPending) && styles.disabledButton]}>
                <Text style={styles.confirmText}>{exportMutation.isPending ? "Preparing…" : "Open original"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0C1C" },
  content: { padding: 18, gap: 16, paddingBottom: 36 },
  hero: { gap: 7, paddingTop: 8 },
  kicker: { color: studioColors.mint, fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: studioColors.ink, fontSize: 31, fontWeight: "900", letterSpacing: -0.6 },
  summary: { color: studioColors.muted, fontSize: 14, lineHeight: 20 },
  loading: { color: studioColors.muted, paddingVertical: 24, textAlign: "center" },
  error: { color: "#FFA6B6", backgroundColor: "#432132", padding: 14, borderRadius: 16, lineHeight: 19 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.65)" },
  modalCard: { backgroundColor: "#17142A", borderTopWidth: 1, borderColor: "#393252", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 14 },
  modalKicker: { color: studioColors.mint, fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  modalTitle: { color: studioColors.ink, fontSize: 24, fontWeight: "900" },
  modalBody: { color: studioColors.muted, fontSize: 14, lineHeight: 20 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 15 },
  cancelText: { color: studioColors.muted, fontWeight: "800" },
  confirmButton: { backgroundColor: studioColors.lavenderDeep, paddingVertical: 12, paddingHorizontal: 17, borderRadius: 14 },
  disabledButton: { opacity: 0.45 },
  confirmText: { color: "#FFF", fontWeight: "900" },
});
