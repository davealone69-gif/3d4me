import Slider from "@react-native-community/slider";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  createLocalLibraryBackup,
  loadLocalProjects,
  loadLocalViewImages,
  parseLocalLibraryBackup,
  writeLocalProjects,
  writeLocalViewImages,
  type LocalCharacterProject,
  type LocalViewImage,
} from "@/lib/character-library";
import { exportAvatarGlb, type AvatarView } from "@/shared/avatar3d";
import {
  characterSettingsSchema,
  clothingMaterials,
  clothingStyles,
  defaultCharacterSettings,
  parseCharacterSettings,
  readableView,
  studioChoices,
  type CharacterSettings,
} from "@/shared/character";
import { AttestationRow, ChoiceChips, StudioSection, studioColors } from "./StudioControls";
import { CharacterViewer, type CharacterViewerHandle } from "./CharacterViewer";

const VIEWS: AvatarView[] = ["front", "side", "rear", "three-quarter"];
const SKIN: { id: CharacterSettings["skinTone"]; hex: string }[] = [
  { id: "porcelain", hex: "#F1D5C2" }, { id: "warm-beige", hex: "#C99378" },
  { id: "olive", hex: "#A87455" }, { id: "golden-brown", hex: "#9C6247" },
  { id: "deep-brown", hex: "#623E32" }, { id: "ebony", hex: "#392721" },
];
const HAIR: { id: CharacterSettings["hairColor"]; hex: string }[] = [
  { id: "black", hex: "#17161A" }, { id: "dark-brown", hex: "#382720" },
  { id: "chestnut", hex: "#75452F" }, { id: "blonde", hex: "#C4A361" },
  { id: "auburn", hex: "#853F2D" }, { id: "silver", hex: "#AEB2BD" },
];
const OUTFIT_COLORS = ["#393452", "#29473F", "#762B45", "#273E5D", "#9B7042", "#D8D0C2", "#242328"];
const ID = () => `fg_local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function createBase64(bytes: Uint8Array) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const hasB = i + 1 < bytes.length;
    const hasC = i + 2 < bytes.length;
    const b = hasB ? bytes[i + 1]! : 0;
    const c = hasC ? bytes[i + 2]! : 0;
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | (b >> 4)];
    output += hasB ? alphabet[((b & 15) << 2) | (c >> 6)] : "=";
    output += hasC ? alphabet[c & 63] : "=";
  }
  return output;
}

function saveWebFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function ParameterSlider({
  label, value, min, max, step = 0.01, format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const display = format ? format(value) : `${Math.round(value * 100)}%`;
  return (
    <View style={styles.parameter}>
      <View style={styles.parameterHeading}><Text style={styles.parameterLabel}>{label}</Text><Text style={styles.parameterValue}>{display}</Text></View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={studioColors.mint}
        maximumTrackTintColor="#423B5E"
        thumbTintColor={studioColors.lavender}
        accessibilityLabel={label}
      />
    </View>
  );
}

function AvatarColorChips({ label, selectedId, colors, labels, onChange }: {
  label: string;
  selectedId: string;
  colors: string[];
  labels: string[];
  onChange: (index: number) => void;
}) {
  return (
    <View style={styles.parameter}>
      <Text style={styles.parameterLabel}>{label}</Text>
      <View style={styles.swatches}>
        {colors.map((color, index) => {
          const active = labels[index] === selectedId;
          return <Pressable key={`${label}-${color}`} onPress={() => onChange(index)} accessibilityRole="button" accessibilityLabel={`${label}: ${labels[index]}`} accessibilityState={{ selected: active }} style={[styles.swatch, { backgroundColor: color }, active && styles.swatchActive]} />;
        })}
      </View>
    </View>
  );
}

export function ModelWorkshop({
  onLocalImagesChanged,
}: {
  onLocalImagesChanged?: (images: LocalViewImage[]) => void;
}) {
  const viewer = useRef<CharacterViewerHandle>(null);
  const [projects, setProjects] = useState<LocalCharacterProject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("My character");
  const [settings, setSettings] = useState<CharacterSettings>({ ...defaultCharacterSettings });
  const [view, setView] = useState<AvatarView>("front");
  const [savedImages, setSavedImages] = useState<LocalViewImage[]>([]);
  const [referenceUri, setReferenceUri] = useState<string | null>(null);
  const [rightsConfirm, setRightsConfirm] = useState(false);
  const [adultConfirm, setAdultConfirm] = useState(false);
  const [adultConfirmedForSession, setAdultConfirmedForSession] = useState(false);
  const [showAdultGate, setShowAdultGate] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const projectsRef = useRef(projects);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    let disposed = false;
    void Promise.all([loadLocalProjects(), loadLocalViewImages()]).then(async ([storedProjects, images]) => {
      if (disposed) return;
      let nextProjects = storedProjects;
      let activeProject = storedProjects[0];
      if (!activeProject) {
        const now = new Date().toISOString();
        activeProject = { id: ID(), name: "My character", settings: { ...defaultCharacterSettings }, createdAt: now, updatedAt: now };
        nextProjects = [activeProject];
        await writeLocalProjects(nextProjects);
      }
      // Adult mode is deliberately session-gated. A restored file never silently re-enables it.
      const restoredSettings = parseCharacterSettings(activeProject.settings);
      const safeSettings = restoredSettings.adultMode
        ? { ...restoredSettings, adultMode: false, clothingStyle: "editorial" as const }
        : restoredSettings;
      setProjects(nextProjects);
      setActiveId(activeProject.id);
      setProjectName(activeProject.name);
      setSettings(safeSettings);
      setSavedImages(images);
      setHydrated(true);
      onLocalImagesChanged?.(images);
    }).catch((error) => {
      if (!disposed) {
        setHydrated(true);
        Alert.alert("Local workspace unavailable", error instanceof Error ? error.message : "The app could not recover its device-local projects.");
      }
    });
    return () => { disposed = true; };
  }, [onLocalImagesChanged]);

  useEffect(() => {
    if (!hydrated || !activeId) return;
    const timer = setTimeout(() => {
      const current = projectsRef.current;
      const existing = current.find((project) => project.id === activeId);
      const now = new Date().toISOString();
      const updated: LocalCharacterProject = {
        id: activeId,
        name: projectName.trim().slice(0, 100) || "Untitled character",
        settings,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      const next = [updated, ...current.filter((project) => project.id !== activeId)];
      projectsRef.current = next;
      setProjects(next);
      void writeLocalProjects(next).catch((error) => Alert.alert("Autosave failed", error instanceof Error ? error.message : "Check free device storage."));
    }, 500);
    return () => clearTimeout(timer);
  }, [activeId, hydrated, projectName, settings]);

  const styleOptions = useMemo(() => {
    const base = clothingStyles.filter((id) => settings.adultMode || (id !== "lingerie" && id !== "swimwear"));
    return base.map((id) => ({ id, label: id.replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase()) }));
  }, [settings.adultMode]);
  const materialOptions = useMemo(() => clothingMaterials.filter((id) => settings.adultMode || id !== "latex").map((id) => ({ id, label: id[0]!.toUpperCase() + id.slice(1) })), [settings.adultMode]);

  const patch = <K extends keyof CharacterSettings>(key: K, value: CharacterSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveCurrentDraft = () => {
    if (!activeId) return projectsRef.current;
    const now = new Date().toISOString();
    const existing = projectsRef.current.find((project) => project.id === activeId);
    const updated: LocalCharacterProject = {
      id: activeId,
      name: projectName.trim().slice(0, 100) || "Untitled character",
      settings: characterSettingsSchema.parse(settings),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = [updated, ...projectsRef.current.filter((project) => project.id !== activeId)];
    projectsRef.current = next;
    setProjects(next);
    void writeLocalProjects(next);
    return next;
  };

  const selectProject = (project: LocalCharacterProject) => {
    const next = parseCharacterSettings(project.settings);
    setActiveId(project.id);
    setProjectName(project.name);
    setSettings(next.adultMode ? { ...next, adultMode: false, clothingStyle: "editorial" } : next);
    setAdultConfirmedForSession(false);
    setAdultConfirm(false);
    setReferenceUri(null);
  };

  const createProject = () => {
    const project = { id: ID(), name: "New character", settings: { ...defaultCharacterSettings }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const next = [project, ...projectsRef.current];
    projectsRef.current = next;
    setProjects(next);
    setActiveId(project.id);
    setProjectName(project.name);
    setSettings({ ...defaultCharacterSettings });
    setView("front");
    setAdultConfirmedForSession(false);
    setReferenceUri(null);
    void writeLocalProjects(next);
  };

  const saveBackup = async () => {
    if (projects.length === 0) return;
    setBusy("backup");
    try {
      const currentProjects = saveCurrentDraft();
      await writeLocalProjects(currentProjects);
      const json = createLocalLibraryBackup(currentProjects);
      const fileName = `figural-backup-${new Date().toISOString().slice(0, 10)}.json`;
      if (Platform.OS === "web") {
        saveWebFile(new Blob([json], { type: "application/json" }), fileName);
      } else {
        const directory = FileSystem.documentDirectory;
        if (!directory) throw new Error("This Android installation does not expose a persistent app document directory.");
        const folder = `${directory}Figural/Backups/`;
        await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
        const uri = `${folder}${fileName}`;
        await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
        const available = await Sharing.isAvailableAsync();
        if (available) await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "Save Figural project backup" });
        else Alert.alert("Backup saved", `Your project library backup is stored in Figural/Backups/${fileName} inside this app.`);
      }
      if (Platform.OS === "web") Alert.alert("Backup downloaded", fileName);
    } catch (error) {
      Alert.alert("Backup unavailable", error instanceof Error ? error.message : "No backup was created.");
    } finally {
      setBusy(null);
    }
  };

  const restoreBackup = async () => {
    setBusy("restore");
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ["application/json", "text/json"], copyToCacheDirectory: true, multiple: false });
      if (picked.canceled || !picked.assets[0]) return;
      const asset = picked.assets[0];
      const raw = Platform.OS === "web" ? await (await fetch(asset.uri)).text() : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const restored = parseLocalLibraryBackup(raw);
      const restoredCopies = restored.map((project) => ({
        ...project,
        id: ID(),
        name: project.name.slice(0, 86) + " (recovered)",
        settings: project.settings.adultMode ? { ...project.settings, adultMode: false, clothingStyle: "editorial" as const } : project.settings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      const currentProjects = saveCurrentDraft();
      const next = [...restoredCopies, ...currentProjects];
      projectsRef.current = next;
      setProjects(next);
      await writeLocalProjects(next);
      Alert.alert("Backup recovered", `${restoredCopies.length} project(s) merged. Existing projects were kept; adult mode remains off until explicitly re-enabled.`);
    } catch (error) {
      Alert.alert("Restore failed", error instanceof Error ? error.message : "This is not a valid Figural project backup.");
    } finally {
      setBusy(null);
    }
  };

  const exportModel = async () => {
    setBusy("glb");
    try {
      const glb = await exportAvatarGlb(settings);
      const fileName = `${projectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "figural-character"}.glb`;
      if (Platform.OS === "web") {
        saveWebFile(new Blob([glb], { type: "model/gltf-binary" }), fileName);
      } else {
        const directory = FileSystem.documentDirectory;
        if (!directory) throw new Error("This Android installation does not expose a persistent app document directory.");
        const folder = `${directory}Figural/Models/`;
        await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
        const uri = `${folder}${fileName}`;
        await FileSystem.writeAsStringAsync(uri, createBase64(new Uint8Array(glb)), { encoding: FileSystem.EncodingType.Base64 });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "model/gltf-binary", dialogTitle: "Export editable Figural character" });
        else Alert.alert("GLB saved", `Your editable model is saved in the app's Figural/Models/${fileName} folder.`);
      }
    } catch (error) {
      Alert.alert("GLB export failed", error instanceof Error ? error.message : "No GLB was written.");
    } finally {
      setBusy(null);
    }
  };

  const saveView = async () => {
    if (!viewer.current || !activeId) {
      Alert.alert("3D preview not ready", "Wait for the live model to finish loading, then capture this view again.");
      return;
    }
    setBusy("png");
    try {
      const capture = await viewer.current.capture();
      const snapshot = capture.image;
      const id = ID();
      const projectId = activeId;
      const safeName = projectName.trim().slice(0, 100) || "Character";
      let imageUri: string;
      if (Platform.OS === "web") {
        if (!(snapshot instanceof Blob)) throw new Error("Browser GL preview returned no shareable image blob.");
        const downloadName = `${safeName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "character"}-${view}.png`;
        saveWebFile(snapshot, downloadName);
        imageUri = `data:image/png;base64,${createBase64(new Uint8Array(await snapshot.arrayBuffer()))}`;
      } else {
        if (typeof snapshot !== "string") throw new Error("The Android GL preview did not return a local file URI.");
        const directory = FileSystem.documentDirectory;
        if (!directory) throw new Error("No persistent Android app folder is available for render history.");
        const folder = `${directory}Figural/Renders/`;
        await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
        const safeProject = projectId.replace(/[^A-Za-z0-9_-]/g, "_");
        const uri = `${folder}${safeProject}-${view}-${Date.now()}.png`;
        await FileSystem.copyAsync({ from: snapshot, to: uri });
        imageUri = uri;
      }
      const image: LocalViewImage = {
        id,
        projectId,
        projectName: safeName,
        view,
        uri: imageUri,
        fileName: `${id}-${view}.png`,
        createdAt: new Date().toISOString(),
        width: capture.width,
        height: capture.height,
      };
      const nextImages = [image, ...savedImages];
      setSavedImages(nextImages);
      await writeLocalViewImages(nextImages);
      onLocalImagesChanged?.(nextImages);
      if (Platform.OS !== "web" && typeof snapshot === "string" && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, { mimeType: "image/png", dialogTitle: `Share ${readableView(view)} view` });
      }
      if (Platform.OS === "web") Alert.alert("View downloaded", `Saved the actual rendered ${readableView(view).toLowerCase()} viewport as a PNG.`);
      else Alert.alert("Local view captured", `A PNG of the real ${readableView(view).toLowerCase()} 3D viewport was stored on this device. It is not a generated photograph.`);
    } catch (error) {
      Alert.alert("View capture failed", error instanceof Error ? error.message : "The model image was not saved.");
    } finally {
      setBusy(null);
    }
  };

  const chooseReference = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, selectionLimit: 1, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setReferenceUri(result.assets[0].uri);
      setRightsConfirm(false);
    }
  };

  const enableAdultMode = () => {
    if (!adultConfirm) return;
    setSettings((current) => ({ ...current, adultMode: true }));
    setAdultConfirmedForSession(true);
    setShowAdultGate(false);
  };

  const turnAdultModeOff = () => {
    setAdultConfirmedForSession(false);
    setAdultConfirm(false);
    setSettings((current) => ({ ...current, adultMode: false, clothingStyle: current.clothingStyle === "lingerie" || current.clothingStyle === "swimwear" ? "editorial" : current.clothingStyle, clothingMaterial: current.clothingMaterial === "latex" ? "silk" : current.clothingMaterial }));
  };

  const saveProjectNow = async () => {
    const normalized = characterSettingsSchema.parse(settings);
    const now = new Date().toISOString();
    const existing = projectsRef.current.find((project) => project.id === activeId);
    const updated: LocalCharacterProject = {
      id: activeId ?? ID(),
      name: projectName.trim().slice(0, 100) || "Untitled character",
      settings: normalized,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = [updated, ...projectsRef.current.filter((project) => project.id !== updated.id)];
    projectsRef.current = next;
    setProjects(next);
    setActiveId(updated.id);
    await writeLocalProjects(next);
    Alert.alert("Saved on this device", "Character settings are stored in the app's private local project library. Back up the library to recover it after uninstalling or changing devices.");
  };

  const tone = (id: CharacterSettings["skinTone"]) => {
    const entry = SKIN.find((candidate) => candidate.id === id)!;
    setSettings((current) => ({ ...current, skinTone: id, skinHex: entry.hex }));
  };
  const hair = (id: CharacterSettings["hairColor"]) => {
    const entry = HAIR.find((candidate) => candidate.id === id)!;
    setSettings((current) => ({ ...current, hairColor: id, hairHex: entry.hex }));
  };

  return (
    <>
      <StudioSection eyebrow="On-device / no paywall" title="Editable 3D character">
        <Text style={styles.intro}>A real, locally built mesh. Adjust the same model and inspect the front, side, rear, or three-quarter angle. Drag across the preview to orbit.</Text>
        <View style={styles.projectNameRow}>
          <TextInput accessibilityLabel="Local character project name" value={projectName} onChangeText={setProjectName} style={[styles.input, { flex: 1 }]} placeholder="Character name" placeholderTextColor="#78718F" maxLength={100} />
          <Pressable style={styles.smallAction} onPress={createProject}><Text style={styles.smallActionText}>+ New</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedProjects}>
          {projects.map((project) => <Pressable key={project.id} onPress={() => selectProject(project)} style={[styles.projectChip, project.id === activeId && styles.projectChipActive]}><Text numberOfLines={1} style={[styles.projectChipText, project.id === activeId && styles.projectChipTextActive]}>{project.name}</Text></Pressable>)}
        </ScrollView>
        <CharacterViewer ref={viewer} settings={settings} view={view} />
        <View style={styles.viewWrap}>
          {VIEWS.map((candidate) => <Pressable key={candidate} onPress={() => setView(candidate)} accessibilityRole="button" accessibilityState={{ selected: candidate === view }} style={[styles.viewButton, view === candidate && styles.viewButtonActive]}><Text style={[styles.viewButtonText, view === candidate && styles.viewButtonTextActive]}>{readableView(candidate)}</Text></Pressable>)}
        </View>
        <View style={styles.actionRow}>
          <Pressable onPress={() => void saveView()} disabled={Boolean(busy)} style={[styles.primaryAction, Boolean(busy) && styles.disabled]}><Text style={styles.primaryActionText}>{busy === "png" ? "Capturing…" : `Save ${readableView(view)} PNG`}</Text></Pressable>
          <Pressable onPress={() => void exportModel()} disabled={Boolean(busy)} style={[styles.secondaryAction, Boolean(busy) && styles.disabled]}><Text style={styles.secondaryActionText}>{busy === "glb" ? "Building…" : "Export editable GLB"}</Text></Pressable>
        </View>
        <View style={styles.actionRow}>
          <Pressable onPress={() => void saveProjectNow()} disabled={!hydrated || Boolean(busy)} style={[styles.secondaryAction, (!hydrated || Boolean(busy)) && styles.disabled]}><Text style={styles.secondaryActionText}>Save project now</Text></Pressable>
          <Text style={styles.autosave}>{hydrated ? "Autosaves locally after edits" : "Recovering local projects…"}</Text>
        </View>
        <View style={styles.actionRow}>
          <Pressable onPress={() => void saveBackup()} disabled={Boolean(busy) || projects.length === 0} style={[styles.secondaryAction, (Boolean(busy) || projects.length === 0) && styles.disabled]}><Text style={styles.secondaryActionText}>{busy === "backup" ? "Preparing…" : "Back up projects"}</Text></Pressable>
          <Pressable onPress={() => void restoreBackup()} disabled={Boolean(busy)} style={[styles.secondaryAction, Boolean(busy) && styles.disabled]}><Text style={styles.secondaryActionText}>{busy === "restore" ? "Restoring…" : "Restore backup"}</Text></Pressable>
        </View>
        <Text style={styles.privacyNote}>Local project data is stored in Android app-private storage and never uploaded by this editor. Export a JSON backup to recover after uninstalling or changing devices. Local PNG/GLB files require free device storage.</Text>
        <Text style={styles.privacyNote}>The viewer-image button captures the real viewport; it is not an AI-generated photograph. There is no image-generation API call, credit meter, or app paywall in this local workflow.</Text>
      </StudioSection>

      <StudioSection eyebrow="Character editor" title="Body proportions">
        <ParameterSlider label="Adult age" value={settings.age} min={21} max={80} step={1} format={(value) => `${Math.round(value)}+`} onChange={(value) => patch("age", Math.round(value))} />
        <ChoiceChips label="Build base" value={settings.bodyBuild} options={studioChoices.bodyBuild} onChange={(value) => patch("bodyBuild", value as CharacterSettings["bodyBuild"])} />
        <ParameterSlider label="Overall height" value={settings.bodyHeight} min={0.82} max={1.18} format={(value) => `${(value * 100).toFixed(0)}%`} onChange={(value) => patch("bodyHeight", value)} />
        <ParameterSlider label="Shoulder width" value={settings.shoulderWidth} min={0.75} max={1.3} onChange={(value) => patch("shoulderWidth", value)} />
        <ParameterSlider label="Chest width" value={settings.chestWidth} min={0.72} max={1.32} onChange={(value) => patch("chestWidth", value)} />
        <ParameterSlider label="Waist width" value={settings.waistWidth} min={0.7} max={1.3} onChange={(value) => patch("waistWidth", value)} />
        <ParameterSlider label="Hip width" value={settings.hipWidth} min={0.72} max={1.35} onChange={(value) => patch("hipWidth", value)} />
        <ParameterSlider label="Arm length" value={settings.armLength} min={0.8} max={1.2} onChange={(value) => patch("armLength", value)} />
        <ParameterSlider label="Leg length" value={settings.legLength} min={0.8} max={1.2} onChange={(value) => patch("legLength", value)} />
      </StudioSection>

      <StudioSection eyebrow="Character editor" title="Face, eyes & hair">
        <ChoiceChips label="Face shape" value={settings.faceShape} options={studioChoices.faceShape} onChange={(value) => patch("faceShape", value as CharacterSettings["faceShape"])} />
        <ParameterSlider label="Face width" value={settings.faceWidth} min={0.78} max={1.22} onChange={(value) => patch("faceWidth", value)} />
        <ParameterSlider label="Jaw width" value={settings.jawWidth} min={0.7} max={1.25} onChange={(value) => patch("jawWidth", value)} />
        <ParameterSlider label="Eye size" value={settings.eyeSize} min={0.75} max={1.3} onChange={(value) => patch("eyeSize", value)} />
        <ParameterSlider label="Eye spacing" value={settings.eyeSpacing} min={0.8} max={1.25} onChange={(value) => patch("eyeSpacing", value)} />
        <ParameterSlider label="Nose size" value={settings.noseSize} min={0.75} max={1.25} onChange={(value) => patch("noseSize", value)} />
        <ChoiceChips label="Eye colour" value={settings.eyeColor} options={studioChoices.eyeColor} onChange={(value) => patch("eyeColor", value as CharacterSettings["eyeColor"])} />
        <AvatarColorChips label="Skin" selectedId={settings.skinTone} colors={SKIN.map((item) => item.hex)} labels={SKIN.map((item) => item.id)} onChange={(index) => tone(SKIN[index]!.id)} />
        <AvatarColorChips label="Hair colour" selectedId={settings.hairColor} colors={HAIR.map((item) => item.hex)} labels={HAIR.map((item) => item.id)} onChange={(index) => hair(HAIR[index]!.id)} />
        <ChoiceChips label="Hair style" value={settings.hairStyle} options={studioChoices.hairStyle} onChange={(value) => patch("hairStyle", value as CharacterSettings["hairStyle"])} />
        <ParameterSlider label="Hair length" value={settings.hairLength} min={0.15} max={1} onChange={(value) => patch("hairLength", value)} />
        <ParameterSlider label="Hair volume" value={settings.hairVolume} min={0.65} max={1.4} onChange={(value) => patch("hairVolume", value)} />
      </StudioSection>

      <StudioSection eyebrow="Character editor" title="Clothing & PBR materials">
        <ChoiceChips label="Garment" value={settings.clothingStyle} options={styleOptions} onChange={(value) => patch("clothingStyle", value as CharacterSettings["clothingStyle"])} />
        <ChoiceChips label="Fabric material" value={settings.clothingMaterial} options={materialOptions} onChange={(value) => patch("clothingMaterial", value as CharacterSettings["clothingMaterial"])} />
        <AvatarColorChips label="Garment colour" selectedId={settings.clothingHex} colors={OUTFIT_COLORS} labels={OUTFIT_COLORS} onChange={(index) => patch("clothingHex", OUTFIT_COLORS[index]!)} />
        <Text style={styles.privacyNote}>These settings change actual mesh proportions and material values exported in the GLB. The procedural clothes are fitted surfaces with material response, not image decals or imported fashion scans.</Text>
      </StudioSection>

      <StudioSection eyebrow="Optional setting / off by default" title="Adult-content mode">
        <Text style={styles.intro}>Adult mode exposes lingerie, swimwear, and additional garment finishes. It does not alter the minimum adult age or enable real-person copying. All output remains a fictional character.</Text>
        {settings.adultMode && adultConfirmedForSession ? (
          <Pressable onPress={turnAdultModeOff} style={styles.modeOff}><Text style={styles.modeOffText}>Adult mode is enabled for this session · tap to switch off</Text></Pressable>
        ) : (
          <Pressable onPress={() => setShowAdultGate(true)} style={styles.modeOn}><Text style={styles.modeOnText}>Enable adult-content mode…</Text></Pressable>
        )}
        <Text style={styles.boundary}>Prohibited: minors/ambiguous youth, non-consensual scenarios, and sexualized recognizable real-person replicas. An imported reference is private guidance only and never used to reconstruct a person&apos;s identity.</Text>
      </StudioSection>

      <StudioSection eyebrow="Private reference / optional" title="On-device reference image">
        <Text style={styles.intro}>Use a photo beside your work as a visual guide. This editor does not upload it, analyze it, or copy the depicted person. The image stays in memory only and is not put into a project or backup; remove it or close the app to clear it.</Text>
        {!referenceUri ? <Pressable onPress={() => void chooseReference()} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Choose from this device</Text></Pressable> : (
          <View style={styles.referenceRow}>
            <Image source={{ uri: referenceUri }} style={styles.referencePreview} />
            <View style={{ flex: 1, gap: 5 }}><Text style={styles.parameterLabel}>Local-only visual guide</Text><Text style={styles.privacyNote}>No network transfer. Not embedded in exports.</Text><Pressable onPress={() => { setReferenceUri(null); setRightsConfirm(false); }}><Text style={styles.removeText}>Remove image</Text></Pressable></View>
          </View>
        )}
        {referenceUri ? <AttestationRow value={rightsConfirm} onChange={setRightsConfirm} label="I have permission to use this image, it depicts an adult, and it is not a non-consensual sexualized reference." detail="This confirmation is an ethical safeguard. It does not transmit or analyze the image." /> : null}
      </StudioSection>

      <StudioSection eyebrow="Honest description" title="What the model is — and is not">
        <Text style={styles.privacyNote}>Actual parametric mesh assembly, not a 2D mock-up: editable body, face, hair, clothing, and PBR colour/roughness/metalness; exported as GLB. Four camera views show one shared model.</Text>
        <Text style={styles.privacyNote}>It is a procedural non-photogrammetric character. No generated skin texture maps, skeletal rig, animation, blendshapes, or motion capture are included. The local preview is a shaded 3D model, not a photorealistic human scan.</Text>
        <Text style={styles.licence}>Runtime licences: Three.js (MIT) and expo-three (MIT). The Figural mesh-generation source is project-authored. No third-party model or human photograph asset is bundled.</Text>
      </StudioSection>

      <Modal visible={showAdultGate} transparent animationType="slide" onRequestClose={() => setShowAdultGate(false)}>
        <View style={styles.modalBack}><View style={styles.modalCard}>
          <Text style={styles.modalEyebrow}>EXPLICIT SESSION OPT-IN</Text>
          <Text style={styles.modalTitle}>Enable adult mode?</Text>
          <Text style={styles.intro}>This turns on adult-only wardrobe choices. It is optional and off by default. Local projects restored from a backup never turn it on automatically.</Text>
          <AttestationRow value={adultConfirm} onChange={setAdultConfirm} label="I am at least 21 years old and I explicitly want to enable adult-content controls." />
          <Text style={styles.boundary}>I will use only fictional adults, and I will not create minors, ambiguous youth, coercion, or a sexualized likeness of a real person without consent.</Text>
          <View style={styles.actionRow}>
            <Pressable onPress={() => { setShowAdultGate(false); setAdultConfirm(false); }} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Cancel</Text></Pressable>
            <Pressable onPress={enableAdultMode} disabled={!adultConfirm} style={[styles.primaryAction, !adultConfirm && styles.disabled]}><Text style={styles.primaryActionText}>Enable adult mode</Text></Pressable>
          </View>
        </View></View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  intro: { color: studioColors.muted, fontSize: 13, lineHeight: 19 },
  projectNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { color: studioColors.ink, backgroundColor: "#211C39", borderColor: studioColors.line, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15 },
  smallAction: { paddingHorizontal: 12, paddingVertical: 11, borderRadius: 13, backgroundColor: "#2A2449", borderWidth: 1, borderColor: "#6755A5" },
  smallActionText: { color: studioColors.lavender, fontSize: 13, fontWeight: "900" },
  savedProjects: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  projectChip: { backgroundColor: "#211C39", borderColor: studioColors.line, borderWidth: 1, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 8, maxWidth: 180 },
  projectChipActive: { borderColor: studioColors.lavender, backgroundColor: "#3B3067" },
  projectChipText: { color: studioColors.muted, fontWeight: "700", fontSize: 12 },
  projectChipTextActive: { color: "#FFFFFF" },
  viewWrap: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  viewButton: { borderRadius: 99, borderWidth: 1, borderColor: studioColors.line, backgroundColor: "#211C39", paddingVertical: 8, paddingHorizontal: 11 },
  viewButtonActive: { borderColor: studioColors.lavender, backgroundColor: "#473A78" },
  viewButtonText: { color: studioColors.muted, fontSize: 12, fontWeight: "800" },
  viewButtonTextActive: { color: "#FFF" },
  actionRow: { flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "space-between" },
  primaryAction: { flex: 1, backgroundColor: "#234D42", borderColor: "#63B79A", borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 11, alignItems: "center" },
  primaryActionText: { color: "#DDFCEF", fontSize: 12, fontWeight: "900", textAlign: "center" },
  secondaryAction: { flex: 1, backgroundColor: "#2A2449", borderColor: "#6755A5", borderWidth: 1, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 10, alignItems: "center" },
  secondaryActionText: { color: studioColors.lavender, fontWeight: "900", fontSize: 12, textAlign: "center" },
  disabled: { opacity: 0.45 },
  autosave: { color: studioColors.muted, fontSize: 11, flex: 1 },
  privacyNote: { color: "#BDB7D0", backgroundColor: "#211D35", padding: 12, borderRadius: 14, fontSize: 12, lineHeight: 18 },
  boundary: { color: "#E7D9B9", backgroundColor: "#372E1F", padding: 12, borderRadius: 14, fontSize: 12, lineHeight: 18 },
  parameter: { gap: 5 },
  parameterHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  parameterLabel: { color: studioColors.ink, fontSize: 13, fontWeight: "700" },
  parameterValue: { color: studioColors.mint, fontSize: 12, fontWeight: "800" },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 4 },
  swatch: { width: 30, height: 30, borderRadius: 99, borderColor: "#746C8D", borderWidth: 1 },
  swatchActive: { borderColor: "#FFFFFF", borderWidth: 3 },
  modeOn: { borderColor: "#A07054", borderWidth: 1, backgroundColor: "#32262C", padding: 13, borderRadius: 14, alignItems: "center" },
  modeOnText: { color: "#FFD0B5", fontWeight: "900", fontSize: 13 },
  modeOff: { borderColor: "#9B7561", borderWidth: 1, backgroundColor: "#332927", padding: 13, borderRadius: 14, alignItems: "center" },
  modeOffText: { color: "#FFD0B5", fontWeight: "800", fontSize: 12 },
  referenceRow: { flexDirection: "row", gap: 13, alignItems: "center" },
  referencePreview: { width: 82, height: 92, borderRadius: 13, backgroundColor: "#28233F" },
  removeText: { color: studioColors.mint, fontSize: 12, fontWeight: "800" },
  licence: { color: "#A8A1C4", fontSize: 11, lineHeight: 17 },
  modalBack: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" },
  modalCard: { backgroundColor: "#17142A", borderTopWidth: 1, borderColor: "#6C513F", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, gap: 14 },
  modalEyebrow: { color: "#E7B796", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  modalTitle: { color: studioColors.ink, fontSize: 24, fontWeight: "900" },
});
