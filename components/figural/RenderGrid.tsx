import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { readableView, type RenderView } from "@/shared/character";
import { studioColors } from "./StudioControls";

export type GalleryRender = {
  id: string;
  view: RenderView;
  status: "queued" | "rendering" | "complete" | "failed";
  imageUrl: string | null;
  previewUrl: string | null;
  transparentVerified: boolean;
  errorMessage: string | null;
  createdAt: Date | string;
};

export function RenderGrid({
  renders,
  onExport,
  compact = false,
}: {
  renders: GalleryRender[];
  onExport?: (render: GalleryRender) => void;
  compact?: boolean;
}) {
  if (renders.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No completed renders yet</Text>
        <Text style={styles.emptyDetail}>Render a view from Studio and it will appear here with its real result status.</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {renders.map((render) => {
        const imageUri = render.previewUrl ?? render.imageUrl;
        return (
          <View key={render.id} style={[styles.card, compact && styles.cardCompact]}>
            {render.status === "complete" && imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" transition={180} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>{render.status === "failed" ? "Render failed" : "Rendering…"}</Text>
              </View>
            )}
            <View style={styles.cardMeta}>
              <View style={styles.viewRow}>
                <Text style={styles.viewTitle}>{readableView(render.view)}</Text>
                {render.transparentVerified ? <Text style={styles.cutout}>ALPHA</Text> : null}
              </View>
              {render.status === "failed" && render.errorMessage ? (
                <Text numberOfLines={2} style={styles.errorText}>{render.errorMessage}</Text>
              ) : (
                <Text style={styles.statusText}>{render.status === "complete" ? "Ready to export" : "Working with renderer"}</Text>
              )}
              {render.status === "complete" && onExport ? (
                <Pressable onPress={() => onExport(render)} style={styles.exportButton} accessibilityRole="button">
                  <Text style={styles.exportText}>Export</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: studioColors.panel,
    borderWidth: 1,
    borderColor: studioColors.line,
  },
  cardCompact: { borderRadius: 16 },
  image: { width: "100%", height: 260, backgroundColor: "#27233E" },
  placeholder: { height: 190, justifyContent: "center", alignItems: "center", backgroundColor: "#25203C" },
  placeholderText: { color: studioColors.muted, fontWeight: "700" },
  cardMeta: { padding: 13, gap: 7 },
  viewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  viewTitle: { color: studioColors.ink, fontSize: 16, fontWeight: "800" },
  cutout: { color: "#14251E", backgroundColor: studioColors.mint, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  statusText: { color: studioColors.muted, fontSize: 12 },
  errorText: { color: "#FFA6B6", fontSize: 12, lineHeight: 17 },
  exportButton: { alignSelf: "flex-start", backgroundColor: "#37305C", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 11 },
  exportText: { color: studioColors.lavender, fontSize: 12, fontWeight: "800" },
  empty: { padding: 22, borderRadius: 18, borderWidth: 1, borderColor: studioColors.line, borderStyle: "dashed", gap: 6 },
  emptyTitle: { color: studioColors.ink, fontSize: 15, fontWeight: "800" },
  emptyDetail: { color: studioColors.muted, fontSize: 13, lineHeight: 18 },
});
