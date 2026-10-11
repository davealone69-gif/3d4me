import { useCallback, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { loadLocalViewImages, writeLocalViewImages, type LocalViewImage } from "@/lib/character-library";
import { readableView } from "@/shared/character";
import { StudioSection, studioColors } from "./StudioControls";

function shareImage(uri: string, fileName: string) {
  if (Platform.OS === "web") {
    const anchor = document.createElement("a");
    anchor.href = uri;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return;
  }
  void Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share saved Figural viewport image" }).catch((error) => {
    Alert.alert("Share unavailable", error instanceof Error ? error.message : "Try again.");
  });
}

export function GalleryScreen() {
  const [images, setImages] = useState<LocalViewImage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    let disposed = false;
    setLoading(true);
    void loadLocalViewImages().then((next) => {
      if (!disposed) setImages(next);
    }).catch((error) => {
      if (!disposed) Alert.alert("Gallery unavailable", error instanceof Error ? error.message : "Could not open local captures.");
    }).finally(() => {
      if (!disposed) setLoading(false);
    });
    return () => { disposed = true; };
  }, []);
  useFocusEffect(refresh);

  const removeImage = (image: LocalViewImage) => {
    Alert.alert("Remove saved viewport?", "This deletes only this local PNG and its gallery record. It cannot be recovered unless separately backed up.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
        void (async () => {
          if (Platform.OS !== "web" && image.uri.startsWith("file://")) await FileSystem.deleteAsync(image.uri, { idempotent: true });
          const next = images.filter((entry) => entry.id !== image.id);
          setImages(next);
          await writeLocalViewImages(next);
        })().catch((error) => Alert.alert("Remove failed", error instanceof Error ? error.message : "The saved image was kept."));
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>DEVICE-LOCAL OUTPUTS</Text>
          <Text style={styles.title}>View gallery</Text>
          <Text style={styles.summary}>PNG images are direct screenshots of the real 3D model view. They stay in this app&apos;s private storage until you share or remove them.</Text>
        </View>
        {loading ? <Text style={styles.loading}>Reading the device-local gallery…</Text> : null}
        {!loading && images.length === 0 ? (
          <StudioSection eyebrow="Nothing saved yet" title="Create your first view">
            <Text style={styles.body}>Open Studio, choose Front, Side, Rear, or Three-quarter, then tap “Save … PNG”. The capture comes from the model&apos;s GL viewport and is not an AI photo.</Text>
          </StudioSection>
        ) : null}
        <View style={styles.grid}>
          {images.map((image) => (
            <View key={image.id} style={styles.card}>
              <Image source={{ uri: image.uri }} style={styles.preview} contentFit="contain" transition={120} />
              <Text style={styles.cardTitle}>{image.projectName}</Text>
              <Text style={styles.cardDetail}>{readableView(image.view)} view · {new Date(image.createdAt).toLocaleDateString()}</Text>
              <View style={styles.actions}>
                <Pressable onPress={() => shareImage(image.uri, image.fileName)} style={styles.shareButton}><Text style={styles.shareText}>Share PNG</Text></Pressable>
                <Pressable onPress={() => removeImage(image)} accessibilityLabel={`Remove ${image.projectName} ${image.view} view`} style={styles.removeButton}><Text style={styles.removeText}>Remove</Text></Pressable>
              </View>
            </View>
          ))}
        </View>
        <StudioSection eyebrow="Privacy" title="Local by default">
          <Text style={styles.body}>No gallery image is uploaded to a renderer. Sharing is an explicit operating-system action you control. Removing an image deletes its saved file from app-private storage.</Text>
        </StudioSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0C1C" },
  content: { padding: 18, gap: 15, paddingBottom: 38 },
  hero: { gap: 7, paddingTop: 8 },
  kicker: { color: studioColors.mint, fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: studioColors.ink, fontSize: 31, fontWeight: "900", letterSpacing: -0.6 },
  summary: { color: studioColors.muted, fontSize: 14, lineHeight: 20 },
  loading: { color: studioColors.muted, paddingVertical: 24, textAlign: "center" },
  body: { color: studioColors.muted, fontSize: 13, lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "48%", flexGrow: 1, maxWidth: "49%", backgroundColor: "#17142A", borderColor: "#302B4B", borderWidth: 1, borderRadius: 19, padding: 10, gap: 6 },
  preview: { width: "100%", height: 240, backgroundColor: "#120F21", borderRadius: 13 },
  cardTitle: { color: studioColors.ink, fontSize: 14, fontWeight: "900" },
  cardDetail: { color: studioColors.muted, fontSize: 11 },
  actions: { flexDirection: "row", gap: 6, marginTop: 4 },
  shareButton: { flex: 1, backgroundColor: "#234D42", borderColor: "#63B79A", borderWidth: 1, borderRadius: 11, alignItems: "center", padding: 8 },
  shareText: { color: "#DDFCEF", fontWeight: "800", fontSize: 11 },
  removeButton: { padding: 8, borderRadius: 11, backgroundColor: "#2A2134" },
  removeText: { color: "#E8A4B0", fontWeight: "800", fontSize: 11 },
});
