import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import appConfig from "../app.config";
import {
  createLocalLibraryBackup,
  localProjectsKey,
  localViewsKey,
  parseLocalLibraryBackup,
} from "../lib/character-library";
import { defaultCharacterSettings } from "../shared/character";

describe("3D4ME identity and update compatibility", () => {
  it("uses the new app name while preserving native IDs and old deep links", () => {
    expect(appConfig.name).toBe("3D4ME");
    expect(appConfig.slug).toBe("3d4me");
    expect(appConfig.scheme).toEqual(["manus087663238228075", "threed4me"]);
    expect(appConfig.android?.package).toBe("space.manus.figural.t087663238228075");
    expect(appConfig.android?.versionCode).toBe(2);
    expect(appConfig.ios?.bundleIdentifier).toBe("space.manus.figural.t087663238228075");
    expect(appConfig.ios?.buildNumber).toBe("2");
  });

  it("uses an npm-valid lowercase package name at the new app version", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { name: string; version: string };
    expect(pkg.name).toBe("3d4me");
    expect(pkg.version).toBe("1.0.1");
  });

  it("retains on-device storage keys and accepts Figural-era backup files", () => {
    expect(localProjectsKey).toBe("figural.local.characters.v1");
    expect(localViewsKey).toBe("figural.local.views.v1");
    const legacyProject = {
      id: "fg_local_legacy",
      name: "Old installed project",
      settings: { ...defaultCharacterSettings },
      createdAt: "2026-10-12T00:00:00.000Z",
      updatedAt: "2026-10-12T00:01:00.000Z",
    };
    const backup = createLocalLibraryBackup([legacyProject]);
    expect(JSON.parse(backup).format).toBe("figural-character-library");
    expect(parseLocalLibraryBackup(backup)[0]?.id).toBe("fg_local_legacy");
  });
});
