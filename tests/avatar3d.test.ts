import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createAvatarModel, exportAvatarGlb, viewRotations } from "../shared/avatar3d";
import { defaultCharacterSettings, parseCharacterSettings } from "../shared/character";

function geometryPointCount(model: THREE.Object3D) {
  let count = 0;
  model.traverse((object) => {
    if (object instanceof THREE.Mesh) count += object.geometry.getAttribute("position").count;
  });
  return count;
}

describe("local parametric adult character generator", () => {
  it("builds one actual mesh assembly with independently named anatomy, face, hair and cloth parts", () => {
    const model = createAvatarModel(defaultCharacterSettings);
    const names: string[] = [];
    model.traverse((part) => names.push(part.name));
    expect(names).toContain("Editable anatomical torso");
    expect(names).toContain("Face - editable jaw width");
    expect(names).toContain("Hair cap - editable");
    expect(names).toContain("Clothing - editable fabric mesh");
    expect(names.length).toBeGreaterThan(80);
    expect(geometryPointCount(model)).toBeGreaterThan(10_000);
  });

  it("changes actual geometry and PBR palette for slider and fabric settings", () => {
    const baseline = createAvatarModel(defaultCharacterSettings);
    const editedSettings = parseCharacterSettings({
      ...defaultCharacterSettings,
      bodyHeight: 1.15,
      waistWidth: 1.24,
      jawWidth: 0.84,
      eyeSpacing: 1.2,
      hairLength: 0.91,
      clothingMaterial: "latex",
      clothingHex: "#7E2437",
      adultMode: true,
      clothingStyle: "lingerie",
    });
    const edited = createAvatarModel(editedSettings);
    const baseTops = baseline.getObjectByName("Editable anatomical torso") as THREE.Mesh;
    const editedTops = edited.getObjectByName("Editable anatomical torso") as THREE.Mesh;
    expect(baseTops.geometry.getAttribute("position").array).not.toEqual(editedTops.geometry.getAttribute("position").array);
    expect(edited.scale.y).toBe(1.15);
    const cloth = edited.getObjectByName("Clothing - editable fabric mesh") as THREE.Mesh;
    expect(cloth.material).toBeInstanceOf(THREE.MeshPhysicalMaterial);
    expect((cloth.material as THREE.MeshPhysicalMaterial).roughness).toBeLessThan(0.2);
    expect((cloth.material as THREE.MeshPhysicalMaterial).color.getHexString()).toBe("7e2437");
  });

  it("offers the requested four camera angles on the same model", () => {
    expect(Object.keys(viewRotations)).toEqual(["front", "side", "rear", "three-quarter"]);
    expect(viewRotations.front).toBe(0);
    expect(viewRotations.side).toBe(Math.PI / 2);
    expect(viewRotations.rear).toBe(Math.PI);
    expect(viewRotations["three-quarter"]).toBe(Math.PI / 4);
  });

  it("exports a real binary glTF with mesh primitives and editable PBR materials", async () => {
    const glb = await exportAvatarGlb(defaultCharacterSettings);
    const data = new DataView(glb);
    expect(data.getUint32(0, true)).toBe(0x46546c67);
    expect(data.getUint32(4, true)).toBe(2);
    expect(data.getUint32(8, true)).toBe(glb.byteLength);
    expect(data.getUint32(16, true)).toBe(0x4e4f534a);
    const jsonLength = data.getUint32(12, true);
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(glb, 20, jsonLength)).trim()) as {
      meshes: unknown[];
      materials: Array<{ pbrMetallicRoughness?: { baseColorFactor?: number[]; metallicFactor?: number; roughnessFactor?: number } }>;
      buffers: Array<{ byteLength: number }>;
    };
    expect(json.meshes.length).toBeGreaterThan(30);
    expect(json.materials.length).toBeGreaterThan(4);
    expect(json.materials.every((entry) => entry.pbrMetallicRoughness?.baseColorFactor?.length === 4)).toBe(true);
    expect(json.buffers[0]!.byteLength).toBeGreaterThan(100_000);
  });
});
