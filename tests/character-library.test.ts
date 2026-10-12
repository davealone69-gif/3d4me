import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => new Map<string, string>());
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => { storage.set(key, value); },
  },
}));

import {
  createLocalLibraryBackup,
  loadLocalProjects,
  parseLocalLibraryBackup,
  writeLocalProjects,
  type LocalCharacterProject,
} from "../lib/character-library";
import { defaultCharacterSettings } from "../shared/character";

const sampleProject: LocalCharacterProject = {
  id: "fg_local_test",
  name: "Offline recovery check",
  settings: { ...defaultCharacterSettings, waistWidth: 1.18, clothingHex: "#1D5577" },
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:01:00.000Z",
};

beforeEach(() => storage.clear());

describe("local character library", () => {
  it("writes and recovers a complete editable project without a server dependency", async () => {
    await writeLocalProjects([sampleProject]);
    const reopened = await loadLocalProjects();
    expect(reopened).toHaveLength(1);
    expect(reopened[0]?.id).toBe(sampleProject.id);
    expect(reopened[0]?.settings.waistWidth).toBe(1.18);
    expect(reopened[0]?.settings.clothingHex).toBe("#1D5577");
  });

  it("round-trips an explicit JSON backup of the full model specification", () => {
    const backup = createLocalLibraryBackup([sampleProject]);
    const recovered = parseLocalLibraryBackup(backup);
    expect(recovered).toHaveLength(1);
    expect(recovered[0]?.settings).toEqual(sampleProject.settings);
    expect(JSON.parse(backup).format).toBe("figural-character-library");
    expect(backup).not.toContain("reference-image-data");
  });

  it("rejects an unrelated or corrupt backup rather than treating it as a valid 3D4ME project backup", () => {
    expect(() => parseLocalLibraryBackup("not json")).toThrow();
    expect(() => parseLocalLibraryBackup(JSON.stringify({ format: "other", version: 1, exportedAt: "2026-10-12T00:00:00.000Z", projects: [] }))).toThrow();
    expect(() => parseLocalLibraryBackup(JSON.stringify({
      format: "figural-character-library",
      version: 1,
      exportedAt: "2026-10-12T00:00:00.000Z",
      projects: [{ ...sampleProject, settings: { invalid: true } }],
    }))).toThrow();
  });
});
