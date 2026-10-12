import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StudioSection, studioColors } from "./StudioControls";

const open = (url: string) => void Linking.openURL(url);

export function SafetyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>3D4ME STANDARD</Text>
          <Text style={styles.title}>Clear boundaries. Clear capability.</Text>
          <Text style={styles.summary}>Adult-content settings are opt-in, with age-and-use acknowledgements. The default local character generator is non-explicit and does not upload references.</Text>
        </View>

        <StudioSection eyebrow="Off by default" title="Optional adult mode">
          <Text style={styles.body}>Adult mode exposes lingerie, swimwear, and additional fabric finishes. Enabling it requires a separate 21+ acknowledgement and a promise to use fictional adults with appropriate rights and consent. Imported images are never used to reproduce the subject.</Text>
          <Text style={styles.body}>No mode removes the 21+ minimum, enables minors or ambiguous youth, or authorizes coercion or sexualized non-consensual likenesses. Adult mode is not silently re-enabled when restoring a backup.</Text>
        </StudioSection>

        <StudioSection eyebrow="Privacy choices" title="Reference-image handling">
          <Text style={styles.body}>An imported image is an on-screen personal visual guide only. It stays transient in app memory; it is not uploaded, machine-analyzed, stored in a project, or included in project backups. Remove it or close the app to clear the reference.</Text>
          <Text style={styles.body}>Saved model-view PNGs and GLB files are generated/stored locally in app-private storage. Sharing uses an explicit Android share-sheet action. Exported files and user-created backups leave app-private storage only when the user chooses where to share them.</Text>
        </StudioSection>

        <StudioSection eyebrow="No hosted renderer required" title="Free local work — with honest limits">
          <Text style={styles.body}>Body/face/hair/clothing edits, four camera angles, viewport PNG captures, and GLB creation run locally. This workflow has no app credit counter, subscription, or online image-generation request. “Unlimited” means no app-imposed generation quota; real use still depends on phone performance, memory, storage, and Android permissions.</Text>
          <Text style={styles.body}>The app no longer offers hosted AI-photo creation from this local editor. Any separate hosted model outside 3D4ME may have its own prices and quotas; 3D4ME cannot promise a third-party unlimited image service.</Text>
        </StudioSection>

        <StudioSection eyebrow="Unverified server scaffolding" title="No cloud accounts or sync">
          <Text style={styles.body}>The source repository contains server routers, database code and a Drizzle schema, but these are not a verified cloud service. Authentication is incomplete and the logout test is intentionally skipped. The local editor saves to this device and does not use the server for accounts or project sync.</Text>
          <Text style={styles.body}>The configured Drizzle output is the project&apos;s drizzle/ root; the separate drizzle/migrations/ directory is only a placeholder. No end-to-end cloud migration, real authentication/authorization, or integration test has been established. Do not rely on or activate cloud accounts/sync until those items are completed and tested.</Text>
        </StudioSection>

        <StudioSection eyebrow="What exports contain" title="3D does not mean fully rigged">
          <Text style={styles.body}>The GLB includes original editable parametric geometry and physically based material values (base colour, roughness, and metalness). The front, side, rear, and three-quarter previews are views of that same mesh assembly.</Text>
          <Text style={styles.body}>This is a procedural 3D character, not a photogrammetry/AI human scan. There are no generated skin/fabric texture maps, skeleton, facial blendshapes, animation, or motion capture. View PNG files are viewport captures, not photographs. Check the implementation&apos;s exact limitations before relying on an export in production.</Text>
        </StudioSection>

        <StudioSection eyebrow="Third-party notices" title="Runtime and model-source licensing">
          <Text style={styles.body}>The project-authored parametric geometry uses the Three.js runtime (MIT) and the expo-three integration (MIT). The app bundles no third-party human model or photograph asset. If you redistribute this project, preserve the notices shipped by its installed dependencies; check each dependency&apos;s current license before redistribution.</Text>
          <Pressable onPress={() => open("https://github.com/mrdoob/three.js/blob/dev/LICENSE")} style={styles.link}><Text style={styles.linkText}>Three.js MIT license ↗</Text></Pressable>
          <Pressable onPress={() => open("https://github.com/expo/expo-three/blob/master/LICENSE")} style={styles.link}><Text style={styles.linkText}>expo-three MIT license ↗</Text></Pressable>
          <Pressable onPress={() => open("https://docs.expo.dev/versions/latest/sdk/gl-view/")} style={styles.link}><Text style={styles.linkText}>Expo GLView support documentation ↗</Text></Pressable>
          <Pressable onPress={() => open("https://threejs.org/docs/pages/GLTFExporter.html")} style={styles.link}><Text style={styles.linkText}>Three.js GLB exporter documentation ↗</Text></Pressable>
        </StudioSection>
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
  body: { color: studioColors.muted, fontSize: 13, lineHeight: 20 },
  link: { backgroundColor: "#211C39", borderRadius: 12, padding: 12, alignSelf: "stretch" },
  linkText: { color: studioColors.lavender, fontWeight: "800", fontSize: 13 },
});
