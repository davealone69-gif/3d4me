import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOwnerToken } from "@/hooks/use-owner-token";
import { trpc } from "@/lib/trpc";
import {
  defaultCharacterSettings,
  parseCharacterSettings,
  renderViews,
  studioChoices,
  type AdultSafetyAttestation,
  type CharacterSettings,
  type ReferenceImageInput,
  type RenderView,
} from "@/shared/character";
import { FeatureReferenceInput as ReferenceImagePicker, type LocalReferenceImage } from "./ReferenceImageInput";
import { RenderGrid, type GalleryRender } from "./RenderGrid";
import { AttestationRow, ChoiceChips, StudioSection, studioColors } from "./StudioControls";

function safetyPayload(
  isFictionalAdult: boolean,
  isAtLeastTwentyOne: boolean,
  hasRightsAndConsent: boolean,
  noMinorOrNonConsensualReplica: boolean,
): AdultSafetyAttestation | null {
  if (!isFictionalAdult || !isAtLeastTwentyOne || !hasRightsAndConsent || !noMinorOrNonConsensualReplica) return null;
  return {
    isFictionalAdult: true,
    isAtLeastTwentyOne: true,
    hasRightsAndConsent: true,
    noMinorOrNonConsensualReplica: true,
  };
}

function referencePayload(reference: LocalReferenceImage | null): ReferenceImageInput | null {
  if (!reference) return null;
  const attestation = reference.attestation;
  if (
    !attestation.sourceShowsAnAuthorizedAdult ||
    !attestation.hasSourceRightsOrConsent ||
    !attestation.noMinorOrAmbiguousYouth ||
    !attestation.noSexualizedNonConsensualReplica
  ) {
    return null;
  }
  return {
    b64Json: reference.b64Json,
    mimeType: reference.mimeType,
    fileName: reference.fileName,
    attestation: {
      sourceShowsAnAuthorizedAdult: true,
      hasSourceRightsOrConsent: true,
      noMinorOrAmbiguousYouth: true,
      noSexualizedNonConsensualReplica: true,
    },
  };
}

export function StudioScreen() {
  const { ownerToken, ready } = useOwnerToken();
  const [projectName, setProjectName] = useState("Untitled adult character");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const [settings, setSettings] = useState<CharacterSettings>({ ...defaultCharacterSettings });
  const [reference, setReference] = useState<LocalReferenceImage | null>(null);
  const [presetName, setPresetName] = useState("");
  const [isFictionalAdult, setIsFictionalAdult] = useState(false);
  const [isAtLeastTwentyOne, setIsAtLeastTwentyOne] = useState(false);
  const [hasRightsAndConsent, setHasRightsAndConsent] = useState(false);
  const [noMinorOrNonConsensualReplica, setNoMinorOrNonConsensualReplica] = useState(false);

  const projectsQuery = trpc.character.listProjects.useQuery(
    { ownerToken: ownerToken ?? "" },
    { enabled: Boolean(ownerToken) },
  );
  const selectedProject = useMemo(
    () => (projectsQuery.data ?? []).find((project) => project.id === selectedProjectId) ?? null,
    [projectsQuery.data, selectedProjectId],
  );
  const rendersQuery = trpc.character.listRenders.useQuery(
    { ownerToken: ownerToken ?? "", projectId: selectedProjectId ?? undefined },
    { enabled: Boolean(ownerToken && selectedProjectId) },
  );
  const presetsQuery = trpc.character.listPresets.useQuery(
    { ownerToken: ownerToken ?? "" },
    { enabled: Boolean(ownerToken) },
  );
  const versionsQuery = trpc.character.listVersions.useQuery(
    { ownerToken: ownerToken ?? "", projectId: selectedProjectId ?? "" },
    { enabled: Boolean(ownerToken && selectedProjectId) },
  );
  const createProject = trpc.character.createProject.useMutation();
  const updateProject = trpc.character.updateProject.useMutation();
  const createPreset = trpc.character.createPreset.useMutation();
  const renderMutation = trpc.character.render.useMutation();

  useEffect(() => {
    const firstProject = projectsQuery.data?.[0];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrates the initial project only after the asynchronous query resolves.
    if (!selectedProjectId && firstProject) setSelectedProjectId(firstProject.id);
  }, [projectsQuery.data, selectedProjectId]);

  useEffect(() => {
    if (!selectedProject || loadedProjectId === selectedProject.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Copies a newly selected persisted project into the editable local draft once.
    setProjectName(selectedProject.name);
    setSettings(parseCharacterSettings(JSON.parse(selectedProject.settingsJson)));
    setLoadedProjectId(selectedProject.id);
  }, [loadedProjectId, selectedProject]);

  const safety = safetyPayload(isFictionalAdult, isAtLeastTwentyOne, hasRightsAndConsent, noMinorOrNonConsensualReplica);
  const approvedReference = referencePayload(reference);
  const isBusy = createProject.isPending || updateProject.isPending || renderMutation.isPending;
  const completedRenders = (rendersQuery.data ?? []) as GalleryRender[];

  const setChoice = <K extends keyof CharacterSettings>(key: K, value: CharacterSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const showSafetyMessage = () => {
    Alert.alert(
      "Complete adult-only confirmations",
      "Figural only creates a character after every adult-age, rights, consent, and no-minor/non-consensual-replica confirmation is checked.",
    );
  };

  const persistProject = async () => {
    if (!ownerToken) throw new Error("This device is still preparing its private workspace.");
    if (!safety) {
      showSafetyMessage();
      throw new Error("Adult-only confirmations are incomplete.");
    }
    if (!selectedProjectId) {
      const created = await createProject.mutateAsync({ ownerToken, name: projectName.trim(), settings, safety });
      setSelectedProjectId(created.id);
      setLoadedProjectId(created.id);
      await projectsQuery.refetch();
      return created.id;
    }
    const updated = await updateProject.mutateAsync({
      ownerToken,
      projectId: selectedProjectId,
      name: projectName.trim(),
      settings,
      safety,
      label: "Updated character specification",
    });
    setLoadedProjectId(updated.id);
    await Promise.all([projectsQuery.refetch(), versionsQuery.refetch()]);
    return updated.id;
  };

  const handleSave = async () => {
    try {
      await persistProject();
      Alert.alert("Character saved", "A new specification version has been recorded for this device.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("confirmations")) return;
      Alert.alert("Save unavailable", error instanceof Error ? error.message : "Try again.");
    }
  };

  const handleRender = async (view: RenderView) => {
    if (!safety) {
      showSafetyMessage();
      return;
    }
    if (reference && !approvedReference) {
      Alert.alert("Reference attestations required", "Confirm all reference-image rights and adult-safety statements before sending it to the renderer.");
      return;
    }
    try {
      const projectId = await persistProject();
      const result = await renderMutation.mutateAsync({
        ownerToken: ownerToken!,
        projectId,
        view,
        settings,
        safety,
        referenceImage: approvedReference ?? undefined,
      });
      await rendersQuery.refetch();
      Alert.alert("Render complete", `${result.view} view is a real completed renderer result and is available in Gallery.`);
    } catch (error) {
      Alert.alert("Render failed", error instanceof Error ? error.message : "The renderer could not finish this request.");
      await rendersQuery.refetch();
    }
  };

  const handleSavePreset = async () => {
    if (!ownerToken || !safety) {
      showSafetyMessage();
      return;
    }
    if (presetName.trim().length < 2) {
      Alert.alert("Name this preset", "Enter a short, descriptive preset name first.");
      return;
    }
    try {
      await createPreset.mutateAsync({ ownerToken, name: presetName.trim(), settings, safety });
      setPresetName("");
      await presetsQuery.refetch();
    } catch (error) {
      Alert.alert("Preset unavailable", error instanceof Error ? error.message : "Try again.");
    }
  };

  const loadPreset = (settingsJson: string) => {
    try {
      setSettings(parseCharacterSettings(JSON.parse(settingsJson)));
      Alert.alert("Preset applied", "Save the project to record this as a new version.");
    } catch {
      Alert.alert("Preset unavailable", "This preset cannot be parsed safely.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.mark}><Text style={styles.markText}>F</Text></View>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>FIGURAL / ADULT-ONLY STUDIO</Text>
            <Text style={styles.title}>Build a character worth keeping.</Text>
            <Text style={styles.summary}>Photorealistic 3D-like reference renders, controlled on your device. No user subscription, credits, purchases, or API-key field.</Text>
          </View>
        </View>

        {!ready || projectsQuery.isLoading ? <View style={styles.loading}><ActivityIndicator color={studioColors.mint} /><Text style={styles.loadingText}>Preparing your private workspace…</Text></View> : null}
        {projectsQuery.error ? <Text style={styles.error}>{projectsQuery.error.message}</Text> : null}

        <StudioSection eyebrow="01 / project" title="Character file">
          <TextInput value={projectName} onChangeText={setProjectName} style={styles.input} placeholder="Character name" placeholderTextColor="#78718F" maxLength={100} />
          <View style={styles.projectRow}>
            {(projectsQuery.data ?? []).slice(0, 4).map((project) => {
              const selected = selectedProjectId === project.id;
              return <Pressable key={project.id} onPress={() => { setSelectedProjectId(project.id); setLoadedProjectId(null); }} style={[styles.projectChip, selected && styles.projectChipActive]}><Text numberOfLines={1} style={[styles.projectChipText, selected && styles.projectChipTextActive]}>{project.name}</Text></Pressable>;
            })}
          </View>
          {selectedProjectId ? <Text style={styles.versionNote}>{versionsQuery.data?.length ?? 0} saved specification versions</Text> : <Text style={styles.versionNote}>New project — saving will create version 1.</Text>}
        </StudioSection>

        <StudioSection eyebrow="02 / adult boundary" title="Creator confirmations">
          <Text style={styles.note}>All four confirmations are required to save, render, create a preset, or export. Figural uses 21+ as its clear adult threshold.</Text>
          <AttestationRow value={isFictionalAdult} onChange={setIsFictionalAdult} label="This character is fictional and clearly represented as an adult." />
          <AttestationRow value={isAtLeastTwentyOne} onChange={setIsAtLeastTwentyOne} label="The character is age 21 or older." />
          <AttestationRow value={hasRightsAndConsent} onChange={setHasRightsAndConsent} label="I have the rights and consent required for my intended creation and use." />
          <AttestationRow value={noMinorOrNonConsensualReplica} onChange={setNoMinorOrNonConsensualReplica} label="I will not create minors, ambiguous youth, or a sexualized non-consensual replica of a real person." />
        </StudioSection>

        <StudioSection eyebrow="03 / identity" title="Visible traits">
          <View style={styles.ageRow}><Text style={styles.ageLabel}>Adult age</Text><View style={styles.ageControl}><Pressable onPress={() => setChoice("age", Math.max(21, settings.age - 1))} style={styles.ageButton}><Text style={styles.ageButtonText}>−</Text></Pressable><Text style={styles.ageValue}>{settings.age}</Text><Pressable onPress={() => setChoice("age", Math.min(80, settings.age + 1))} style={styles.ageButton}><Text style={styles.ageButtonText}>+</Text></Pressable></View></View>
          <ChoiceChips label="Body build" value={settings.bodyBuild} options={studioChoices.bodyBuild} onChange={(value) => setChoice("bodyBuild", value as CharacterSettings["bodyBuild"])} />
          <ChoiceChips label="Face shape" value={settings.faceShape} options={studioChoices.faceShape} onChange={(value) => setChoice("faceShape", value as CharacterSettings["faceShape"])} />
          <ChoiceChips label="Skin tone" value={settings.skinTone} options={studioChoices.skinTone} onChange={(value) => setChoice("skinTone", value as CharacterSettings["skinTone"])} />
          <ChoiceChips label="Hair style" value={settings.hairStyle} options={studioChoices.hairStyle} onChange={(value) => setChoice("hairStyle", value as CharacterSettings["hairStyle"])} />
          <ChoiceChips label="Hair color" value={settings.hairColor} options={studioChoices.hairColor} onChange={(value) => setChoice("hairColor", value as CharacterSettings["hairColor"])} />
          <ChoiceChips label="Eye color" value={settings.eyeColor} options={studioChoices.eyeColor} onChange={(value) => setChoice("eyeColor", value as CharacterSettings["eyeColor"])} />
        </StudioSection>

        <StudioSection eyebrow="04 / direction" title="Creative controls">
          <ChoiceChips label="Wardrobe" value={settings.wardrobe} options={studioChoices.wardrobe} onChange={(value) => setChoice("wardrobe", value as CharacterSettings["wardrobe"])} />
          <ChoiceChips label="Expression" value={settings.expression} options={studioChoices.expression} onChange={(value) => setChoice("expression", value as CharacterSettings["expression"])} />
          <ChoiceChips label="Lighting" value={settings.lighting} options={studioChoices.lighting} onChange={(value) => setChoice("lighting", value as CharacterSettings["lighting"])} />
          <ChoiceChips label="Camera" value={settings.cameraAngle} options={studioChoices.cameraAngle} onChange={(value) => setChoice("cameraAngle", value as CharacterSettings["cameraAngle"])} />
          <ChoiceChips label="Scene" value={settings.sceneBackground} options={studioChoices.sceneBackground} onChange={(value) => setChoice("sceneBackground", value as CharacterSettings["sceneBackground"])} />
          <ChoiceChips label="Export background" value={settings.outputBackground} options={studioChoices.outputBackground} onChange={(value) => setChoice("outputBackground", value as CharacterSettings["outputBackground"])} />
          {settings.outputBackground === "transparent" ? <Text style={styles.cutoutNote}>Figural uses a local foreground-segmentation stage after rendering and accepts the export only when the final PNG has a verified alpha channel. Opaque output is never relabeled as transparent.</Text> : null}
        </StudioSection>

        <ReferenceImagePicker value={reference} onChange={setReference} />

        <StudioSection eyebrow="05 / presets" title="Reuse this direction">
          <TextInput value={presetName} onChangeText={setPresetName} style={styles.input} placeholder="Preset name, e.g. Noir editorial" placeholderTextColor="#78718F" maxLength={100} />
          <Pressable onPress={() => void handleSavePreset()} disabled={createPreset.isPending} style={[styles.secondaryButton, createPreset.isPending && styles.disabled]}><Text style={styles.secondaryButtonText}>{createPreset.isPending ? "Saving…" : "Save reusable preset"}</Text></Pressable>
          <View style={styles.projectRow}>{(presetsQuery.data ?? []).map((preset) => <Pressable key={preset.id} onPress={() => loadPreset(preset.settingsJson)} style={styles.projectChip}><Text style={styles.projectChipText}>{preset.name}</Text></Pressable>)}</View>
        </StudioSection>

        <View style={styles.actions}>
          <Pressable onPress={() => void handleSave()} disabled={isBusy || !ready} style={[styles.saveButton, (isBusy || !ready) && styles.disabled]}><Text style={styles.saveText}>{createProject.isPending || updateProject.isPending ? "Saving file…" : "Save character version"}</Text></Pressable>
          <Text style={styles.renderHeading}>Character sheet renderer</Text>
          <Text style={styles.renderInfo}>Each button sends a real request, records queue/failure/completion status, and stores only actual returned image bytes.</Text>
          <View style={styles.renderButtons}>{renderViews.map((view) => <Pressable key={view} onPress={() => void handleRender(view)} disabled={isBusy || !ready} style={[styles.renderButton, (isBusy || !ready) && styles.disabled]}><Text style={styles.renderButtonText}>{renderMutation.isPending ? "Rendering…" : `Render ${view}`}</Text></Pressable>)}</View>
          {renderMutation.error ? <Text style={styles.error}>{renderMutation.error.message}</Text> : null}
        </View>

        <StudioSection eyebrow="Latest character sheet" title="Render status">
          <RenderGrid renders={completedRenders} compact />
        </StudioSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0C1C" },
  content: { padding: 18, gap: 16, paddingBottom: 38 },
  hero: { flexDirection: "row", alignItems: "flex-start", gap: 13, paddingTop: 8, paddingBottom: 2 },
  mark: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center", backgroundColor: "#8D73F0", borderColor: "#C5B7FF", borderWidth: 1 },
  markText: { color: "#FFF", fontSize: 28, fontWeight: "900", fontStyle: "italic" },
  heroCopy: { flex: 1, gap: 5 },
  kicker: { color: studioColors.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: studioColors.ink, fontSize: 29, fontWeight: "900", letterSpacing: -0.8, lineHeight: 33 },
  summary: { color: studioColors.muted, fontSize: 13, lineHeight: 19 },
  loading: { flexDirection: "row", justifyContent: "center", gap: 9, alignItems: "center", padding: 10 },
  loadingText: { color: studioColors.muted, fontSize: 13 },
  error: { color: "#FFB2C1", backgroundColor: "#432132", borderRadius: 14, padding: 12, fontSize: 13, lineHeight: 18 },
  input: { color: studioColors.ink, backgroundColor: "#211C39", borderColor: studioColors.line, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15 },
  projectRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  projectChip: { backgroundColor: "#211C39", borderColor: studioColors.line, borderWidth: 1, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 8, maxWidth: 180 },
  projectChipActive: { borderColor: studioColors.lavender, backgroundColor: "#3B3067" },
  projectChipText: { color: studioColors.muted, fontWeight: "700", fontSize: 12 },
  projectChipTextActive: { color: "#FFF" },
  versionNote: { color: studioColors.muted, fontSize: 12 },
  note: { color: studioColors.muted, fontSize: 13, lineHeight: 19 },
  ageRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 2 },
  ageLabel: { color: studioColors.ink, fontWeight: "700", fontSize: 14 },
  ageControl: { flexDirection: "row", alignItems: "center", backgroundColor: "#211C39", borderColor: studioColors.line, borderWidth: 1, borderRadius: 13, overflow: "hidden" },
  ageButton: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  ageButtonText: { color: studioColors.lavender, fontSize: 20, fontWeight: "700" },
  ageValue: { width: 36, textAlign: "center", color: studioColors.ink, fontSize: 15, fontWeight: "800" },
  cutoutNote: { color: "#D6CEF9", backgroundColor: "#2D274A", borderRadius: 13, padding: 11, fontSize: 12, lineHeight: 18 },
  secondaryButton: { borderWidth: 1, borderColor: "#6755A5", backgroundColor: "#2A2449", borderRadius: 14, alignItems: "center", padding: 12 },
  secondaryButtonText: { color: studioColors.lavender, fontWeight: "900", fontSize: 13 },
  actions: { gap: 10, paddingTop: 2 },
  saveButton: { backgroundColor: "#234D42", borderColor: "#63B79A", borderWidth: 1, borderRadius: 17, padding: 14, alignItems: "center" },
  saveText: { color: "#DDFCEF", fontSize: 14, fontWeight: "900" },
  renderHeading: { color: studioColors.ink, fontSize: 20, fontWeight: "900", marginTop: 8 },
  renderInfo: { color: studioColors.muted, fontSize: 13, lineHeight: 18 },
  renderButtons: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  renderButton: { backgroundColor: studioColors.lavenderDeep, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11 },
  renderButtonText: { color: "#FFF", fontWeight: "900", fontSize: 12, textTransform: "capitalize" },
  disabled: { opacity: 0.46 },
});
