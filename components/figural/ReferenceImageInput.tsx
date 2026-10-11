import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AttestationRow, StudioSection, studioColors } from "./StudioControls";
import type { ReferenceImageInput } from "@/shared/character";

type ReferenceAttestationDraft = {
  sourceShowsAnAuthorizedAdult: boolean;
  hasSourceRightsOrConsent: boolean;
  noMinorOrAmbiguousYouth: boolean;
  noSexualizedNonConsensualReplica: boolean;
};

export type LocalReferenceImage = Omit<ReferenceImageInput, "attestation"> & {
  previewUri: string;
  attestation: ReferenceAttestationDraft;
};

export function FeatureReferenceInput({
  value,
  onChange,
}: {
  value: LocalReferenceImage | null;
  onChange: (value: LocalReferenceImage | null) => void;
}) {
  const [sourceShowsAnAuthorizedAdult, setSourceShowsAnAuthorizedAdult] = useState(
    value?.attestation.sourceShowsAnAuthorizedAdult ?? false,
  );
  const [hasSourceRightsOrConsent, setHasSourceRightsOrConsent] = useState(
    value?.attestation.hasSourceRightsOrConsent ?? false,
  );
  const [noMinorOrAmbiguousYouth, setNoMinorOrAmbiguousYouth] = useState(
    value?.attestation.noMinorOrAmbiguousYouth ?? false,
  );
  const [noSexualizedNonConsensualReplica, setNoSexualizedNonConsensualReplica] = useState(
    value?.attestation.noSexualizedNonConsensualReplica ?? false,
  );

  const updateAttestation = (next: Partial<LocalReferenceImage["attestation"]>) => {
    if (!value) return;
    onChange({
      ...value,
      attestation: {
        sourceShowsAnAuthorizedAdult,
        hasSourceRightsOrConsent,
        noMinorOrAmbiguousYouth,
        noSexualizedNonConsensualReplica,
        ...next,
      },
    });
  };

  const chooseReference = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.72,
      base64: true,
      selectionLimit: 1,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.base64) {
      Alert.alert("Image unavailable", "Choose an image that can be read from the device library.");
      return;
    }

    const mimeType =
      asset.mimeType === "image/png" || asset.mimeType === "image/webp" || asset.mimeType === "image/jpeg"
        ? asset.mimeType
        : "image/jpeg";

    if (asset.base64.length > 12_000_000) {
      Alert.alert("Image is too large", "Choose a smaller image. References must be 9 MB or less after compression.");
      return;
    }

    const next: LocalReferenceImage = {
      b64Json: asset.base64,
      mimeType,
      fileName: asset.fileName ?? "reference-image",
      previewUri: asset.uri,
      attestation: {
        sourceShowsAnAuthorizedAdult: false,
        hasSourceRightsOrConsent: false,
        noMinorOrAmbiguousYouth: false,
        noSexualizedNonConsensualReplica: false,
      },
    };
    setSourceShowsAnAuthorizedAdult(false);
    setHasSourceRightsOrConsent(false);
    setNoMinorOrAmbiguousYouth(false);
    setNoSexualizedNonConsensualReplica(false);
    onChange(next);
  };

  return (
    <StudioSection eyebrow="Optional" title="Reference image">
      <Text style={styles.intro}>
        Carry selected visual traits into this character through the real renderer. The source image is used for this
        request only and is not saved as a project asset.
      </Text>

      {value ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: value.previewUri }} style={styles.preview} contentFit="cover" />
          <View style={styles.previewCopy}>
            <Text style={styles.previewTitle}>Feature reference ready</Text>
            <Text style={styles.previewDetail}>The renderer receives it only after every rights attestation below.</Text>
            <Pressable onPress={() => onChange(null)} style={styles.linkButton}>
              <Text style={styles.linkText}>Remove reference</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={chooseReference} style={styles.chooseButton} accessibilityRole="button">
          <Text style={styles.chooseButtonText}>Choose a feature reference</Text>
          <Text style={styles.chooseButtonHint}>From your device library</Text>
        </Pressable>
      )}

      {value ? (
        <View style={styles.attestations}>
          <AttestationRow
            value={sourceShowsAnAuthorizedAdult}
            onChange={(next) => {
              setSourceShowsAnAuthorizedAdult(next);
              updateAttestation({ sourceShowsAnAuthorizedAdult: next });
            }}
            label="The source depicts a fictional adult or an adult aged 21+."
          />
          <AttestationRow
            value={hasSourceRightsOrConsent}
            onChange={(next) => {
              setHasSourceRightsOrConsent(next);
              updateAttestation({ hasSourceRightsOrConsent: next });
            }}
            label="I have the rights or subject consent to use this image as a feature reference."
          />
          <AttestationRow
            value={noMinorOrAmbiguousYouth}
            onChange={(next) => {
              setNoMinorOrAmbiguousYouth(next);
              updateAttestation({ noMinorOrAmbiguousYouth: next });
            }}
            label="It does not depict a minor or an ambiguously youthful subject."
          />
          <AttestationRow
            value={noSexualizedNonConsensualReplica}
            onChange={(next) => {
              setNoSexualizedNonConsensualReplica(next);
              updateAttestation({ noSexualizedNonConsensualReplica: next });
            }}
            label="I am not creating a sexualized, non-consensual replica of an identifiable person."
          />
        </View>
      ) : null}
    </StudioSection>
  );
}

const styles = StyleSheet.create({
  intro: { color: studioColors.muted, fontSize: 13, lineHeight: 19 },
  chooseButton: {
    backgroundColor: "#272142",
    borderColor: studioColors.lavenderDeep,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  chooseButtonText: { color: studioColors.lavender, fontWeight: "800", fontSize: 15 },
  chooseButtonHint: { color: studioColors.muted, fontSize: 12 },
  previewWrap: { flexDirection: "row", gap: 13, alignItems: "center" },
  preview: { width: 72, height: 90, borderRadius: 14, backgroundColor: "#28233F" },
  previewCopy: { flex: 1, gap: 4 },
  previewTitle: { color: studioColors.ink, fontSize: 15, fontWeight: "800" },
  previewDetail: { color: studioColors.muted, fontSize: 12, lineHeight: 17 },
  linkButton: { alignSelf: "flex-start", paddingTop: 4 },
  linkText: { color: studioColors.mint, fontSize: 12, fontWeight: "800" },
  attestations: { gap: 8 },
});
