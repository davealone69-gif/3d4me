import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Choice } from "@/shared/character";

const colors = {
  ink: "#EFEAFF",
  muted: "#A8A1C4",
  line: "#302B4B",
  panel: "#17142A",
  surface: "#211C39",
  lavender: "#B7A3FF",
  lavenderDeep: "#7D65DD",
  mint: "#80E6C4",
};

export function StudioSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function ChoiceChips({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Choice[];
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((option) => {
          const active = option.id === value;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AttestationRow({
  value,
  label,
  detail,
  onChange,
}: {
  value: boolean;
  label: string;
  detail?: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[styles.attestation, value && styles.attestationActive]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      <View style={[styles.checkbox, value && styles.checkboxActive]}>
        {value ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <View style={styles.attestationCopy}>
        <Text style={styles.attestationLabel}>{label}</Text>
        {detail ? <Text style={styles.attestationDetail}>{detail}</Text> : null}
      </View>
    </Pressable>
  );
}

export const studioColors = colors;

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  eyebrow: {
    color: colors.mint,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionBody: { gap: 16 },
  field: { gap: 9 },
  fieldLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.lavenderDeep,
    borderColor: colors.lavender,
  },
  chipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: { color: "#FFFFFF" },
  attestation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
  },
  attestationActive: {
    backgroundColor: "#202E3B",
    borderColor: "#4F8E7A",
  },
  checkbox: {
    marginTop: 1,
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#6F688E",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: colors.mint, borderColor: colors.mint },
  checkmark: { color: "#12251F", fontWeight: "900", fontSize: 15 },
  attestationCopy: { flex: 1, gap: 3 },
  attestationLabel: { color: colors.ink, fontSize: 14, fontWeight: "700", lineHeight: 19 },
  attestationDetail: { color: colors.muted, fontSize: 12, lineHeight: 17 },
});
