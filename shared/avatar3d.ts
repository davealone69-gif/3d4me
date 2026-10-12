import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import type { CharacterSettings } from "./character";

export const viewRotations = {
  front: 0,
  side: Math.PI / 2,
  rear: Math.PI,
  "three-quarter": Math.PI / 4,
} as const;

export type AvatarView = keyof typeof viewRotations;

const skinSwatches: Record<CharacterSettings["skinTone"], string> = {
  porcelain: "#F1D5C2",
  "warm-beige": "#C99378",
  olive: "#A87455",
  "golden-brown": "#9C6247",
  "deep-brown": "#623E32",
  ebony: "#392721",
};

const hairSwatches: Record<CharacterSettings["hairColor"], string> = {
  black: "#17161A",
  "dark-brown": "#382720",
  chestnut: "#75452F",
  blonde: "#C4A361",
  auburn: "#853F2D",
  silver: "#AEB2BD",
};

const eyeSwatches: Record<CharacterSettings["eyeColor"], string> = {
  brown: "#634530",
  hazel: "#85723E",
  green: "#4B805F",
  blue: "#577DA4",
  grey: "#87909C",
};

export function effectiveAvatarColors(settings: CharacterSettings) {
  return {
    skin: skinSwatches[settings.skinTone] || settings.skinHex,
    hair: hairSwatches[settings.hairColor] || settings.hairHex,
    eyes: eyeSwatches[settings.eyeColor],
    clothing: settings.clothingHex,
  };
}

function material(
  color: string,
  roughness = 0.72,
  metalness = 0,
  options: Partial<THREE.MeshPhysicalMaterialParameters> = {},
) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat: 0.1,
    clearcoatRoughness: 0.66,
    ...options,
  });
}

function addSphere(
  parent: THREE.Group,
  name: string,
  color: string | THREE.Material,
  position: [number, number, number],
  scale: [number, number, number],
  options: { roughness?: number; metalness?: number; segments?: number } = {},
) {
  const surface = typeof color === "string" ? material(color, options.roughness, options.metalness) : color;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, options.segments ?? 24, options.segments ?? 18),
    surface,
  );
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

type Ring = { y: number; rx: number; rz: number };

function loftGeometry(rings: Ring[], radialSegments = 48) {
  const vertices: number[] = [];
  const indices: number[] = [];
  for (const ring of rings) {
    for (let slice = 0; slice <= radialSegments; slice += 1) {
      const angle = (slice / radialSegments) * Math.PI * 2;
      vertices.push(Math.cos(angle) * ring.rx, ring.y, Math.sin(angle) * ring.rz);
    }
  }
  const row = radialSegments + 1;
  for (let band = 0; band < rings.length - 1; band += 1) {
    for (let slice = 0; slice < radialSegments; slice += 1) {
      const a = band * row + slice;
      const b = a + row;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute("normal");
  const normal = new THREE.Vector3();
  for (let vertex = 0; vertex < normals.count; vertex += 1) {
    normal.fromBufferAttribute(normals, vertex).normalize();
    normals.setXYZ(vertex, normal.x, normal.y, normal.z);
  }
  return geometry;
}

function addLoft(parent: THREE.Group, name: string, rings: Ring[], surface: THREE.Material, segments = 48) {
  const mesh = new THREE.Mesh(loftGeometry(rings, segments), surface);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCapsuleBetween(
  parent: THREE.Group,
  name: string,
  surface: THREE.Material,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  radialSegments = 14,
) {
  const distance = start.distanceTo(end);
  const capsule = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, Math.max(distance - 2 * radius, 0.001), 6, radialSegments),
    surface,
  );
  capsule.name = name;
  capsule.position.copy(start).add(end).multiplyScalar(0.5);
  capsule.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
  capsule.castShadow = true;
  capsule.receiveShadow = true;
  parent.add(capsule);
  return capsule;
}

function bodyFactors(settings: CharacterSettings) {
  const build = { slender: 0.88, athletic: 0.98, curvy: 1.08, strong: 1.12, soft: 1.1 }[settings.bodyBuild];
  return {
    shoulder: build * settings.shoulderWidth,
    chest: build * settings.chestWidth,
    waist: build * settings.waistWidth,
    hip: build * settings.hipWidth,
  };
}

function createHair(parent: THREE.Group, settings: CharacterSettings, color: string) {
  const hairSurface = material(color, 0.38, 0.02, { clearcoat: 0.26, clearcoatRoughness: 0.36 });
  const volume = settings.hairVolume;
  const headCenter = new THREE.Vector3(0, 1.79, 0);
  addSphere(parent, "Hair cap - editable", hairSurface, [0, 1.92, -0.02], [0.17 * volume, 0.11 * volume, 0.155 * volume], { segments: 28 });

  const style = settings.hairStyle;
  const count = style === "braided-updo" ? 36 : style === "curly-volume" ? 68 : 52;
  const length = (0.1 + settings.hairLength * 0.51) * (style === "short-crop" ? 0.33 : 1);
  const strandRadius = style === "curly-volume" ? 0.011 : 0.007;
  for (let strand = 0; strand < count; strand += 1) {
    const angle = (strand / count) * Math.PI * 2;
    if (Math.sin(angle) > 0.68 && Math.abs(Math.cos(angle)) < 0.75) continue;
    const wave = style === "long-waves" ? 0.028 : style === "curly-volume" ? 0.05 : 0.012;
    const rootRadiusX = 0.147 * volume;
    const rootRadiusZ = 0.155 * volume;
    const start = new THREE.Vector3(
      Math.cos(angle) * rootRadiusX,
      1.87 + 0.025 * Math.cos(angle * 2),
      Math.sin(angle) * rootRadiusZ,
    );
    const targetY = Math.max(1.53, headCenter.y - length - 0.045);
    const swing = wave * Math.sin(strand * 1.7);
    const points = [
      start,
      new THREE.Vector3(start.x * 1.12 + swing * 0.35, 1.81, start.z * 1.12),
      new THREE.Vector3(start.x * 1.23 + swing, 1.69, start.z * 1.21),
      new THREE.Vector3(start.x * 1.28 + swing * 1.35, targetY, start.z * 1.25),
    ];
    if (style === "braided-updo") {
      points[2]!.y = 1.92;
      points[3]!.y = 1.99;
    }
    if (style === "sleek-bob") points[3]!.y = Math.max(points[3]!.y, 1.7);
    if (style === "short-crop") points[3]!.y = 1.78;
    const curve = new THREE.CatmullRomCurve3(points);
    const strandMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, strandRadius * volume, 5, false), hairSurface);
    strandMesh.name = `Hair strand ${strand + 1}`;
    strandMesh.castShadow = true;
    parent.add(strandMesh);
  }
  return hairSurface;
}

function addClothing(parent: THREE.Group, settings: CharacterSettings, outfitColor: string, body: ReturnType<typeof bodyFactors>) {
  const fabric = {
    cotton: { roughness: 0.9, metalness: 0 },
    silk: { roughness: 0.32, metalness: 0.02 },
    satin: { roughness: 0.22, metalness: 0.05 },
    denim: { roughness: 0.84, metalness: 0 },
    leather: { roughness: 0.4, metalness: 0.02 },
    latex: { roughness: 0.12, metalness: 0.08 },
  }[settings.clothingMaterial];
  const cloth = material(outfitColor, fabric.roughness, fabric.metalness, { clearcoat: 0.22, clearcoatRoughness: fabric.roughness });
  const trim = material("#C9A66B", 0.27, 0.7);
  const style = settings.adultMode ? settings.clothingStyle : settings.clothingStyle === "lingerie" ? "editorial" : settings.clothingStyle;
  const cropped = settings.adultMode && (style === "swimwear" || style === "lingerie");
  const topBottom = cropped ? 1.13 : 0.79;
  const topRings: Ring[] = [
    { y: topBottom, rx: 0.265 * body.hip, rz: 0.166 },
    { y: 0.98, rx: 0.28 * body.hip, rz: 0.17 },
    { y: 1.12, rx: 0.22 * body.waist, rz: 0.145 },
    { y: 1.27, rx: 0.278 * body.chest, rz: 0.167 },
    { y: 1.42, rx: 0.295 * body.chest, rz: 0.161 },
    { y: 1.56, rx: 0.31 * body.shoulder, rz: 0.133 },
  ];
  addLoft(parent, "Clothing - editable fabric mesh", topRings, cloth, 52);

  const leftHip = 0.145 * body.hip;
  const legScale = settings.legLength;
  const leftHipStart = new THREE.Vector3(-leftHip, 0.79, 0);
  const leftAnkle = new THREE.Vector3(-0.155, 0.075 * legScale, 0);
  const rightHipStart = new THREE.Vector3(leftHip, 0.79, 0);
  const rightAnkle = new THREE.Vector3(0.155, 0.075 * legScale, 0);
  if (style === "formal-dress" && !cropped) {
    addLoft(parent, "Formal skirt", [
      { y: 0.31, rx: 0.34 * body.hip, rz: 0.195 },
      { y: 0.78, rx: 0.22 * body.hip, rz: 0.16 },
    ], cloth, 48);
  } else {
    const fabricLegs = style === "swimwear" || style === "lingerie" ? 0.10 : 0.075;
    addCapsuleBetween(parent, "Left trouser leg", cloth, leftHipStart, leftAnkle, fabricLegs, 18);
    addCapsuleBetween(parent, "Right trouser leg", cloth, rightHipStart, rightAnkle, fabricLegs, 18);
  }

  if (!cropped) {
    addCapsuleBetween(parent, "Left sleeve", cloth, new THREE.Vector3(-0.32 * body.shoulder, 1.5, 0), new THREE.Vector3(-0.405, 1.06 * settings.armLength, 0), 0.066, 16);
    addCapsuleBetween(parent, "Right sleeve", cloth, new THREE.Vector3(0.32 * body.shoulder, 1.5, 0), new THREE.Vector3(0.405, 1.06 * settings.armLength, 0), 0.066, 16);
  }

  const belt = addSphere(parent, "Garment clasp", trim, [0, 0.94, 0.168], [0.047, 0.034, 0.012], { segments: 12 });
  belt.rotation.z = Math.PI / 4;
  if (style === "tailored" || style === "editorial") {
    for (const y of [1.3, 1.2, 1.1]) {
      addSphere(parent, "Metal garment button", trim, [0, y, 0.17], [0.013, 0.013, 0.006], { segments: 8 });
    }
  }
  return { cloth, trim };
}

export function createAvatarModel(settings: CharacterSettings) {
  const root = new THREE.Group();
  root.name = "3D4ME Editable Adult Character";
  const colors = effectiveAvatarColors(settings);
  const factors = bodyFactors(settings);
  const faceShape = {
    oval: { x: 1.0, y: 1.03, cheek: 1.0 },
    heart: { x: 1.04, y: 1.02, cheek: 1.04 },
    square: { x: 1.04, y: 0.98, cheek: 0.94 },
    diamond: { x: 0.97, y: 1.06, cheek: 1.08 },
    round: { x: 1.06, y: 0.95, cheek: 1.08 },
  }[settings.faceShape];
  const skin = material(colors.skin, 0.58, 0, { clearcoat: 0.08, clearcoatRoughness: 0.52 });
  const hair = material(colors.hair, 0.38, 0.02, { clearcoat: 0.26, clearcoatRoughness: 0.36 });
  const eyeWhite = material("#F2EADF", 0.23, 0);
  const iris = material(colors.eyes, 0.18, 0.08);
  const dark = material("#211618", 0.23, 0);

  const bodyWidth = (value: number) => value * (settings.bodyBuild === "slender" ? 0.92 : settings.bodyBuild === "strong" ? 1.08 : 1);
  const silhouette = bodyWidth(1);
  addLoft(root, "Editable anatomical torso", [
    { y: 0.73, rx: 0.235 * factors.hip * silhouette, rz: 0.137 },
    { y: 0.83, rx: 0.31 * factors.hip * silhouette, rz: 0.17 },
    { y: 0.98, rx: 0.275 * factors.waist * silhouette, rz: 0.158 },
    { y: 1.12, rx: 0.225 * factors.waist * silhouette, rz: 0.132 },
    { y: 1.29, rx: 0.29 * factors.chest * silhouette, rz: 0.17 },
    { y: 1.44, rx: 0.315 * factors.chest * silhouette, rz: 0.167 },
    { y: 1.57, rx: 0.31 * factors.shoulder * silhouette, rz: 0.132 },
  ], skin, 48);

  addCapsuleBetween(root, "Neck", skin, new THREE.Vector3(0, 1.54, 0), new THREE.Vector3(0, 1.72, 0), 0.095, 18);
  addSphere(root, "Face - editable jaw width", skin, [0, 1.795, 0], [0.156 * settings.faceWidth * faceShape.x, 0.208 * faceShape.y, 0.153], { segments: 32 });
  addSphere(root, "Jaw contour", skin, [0, 1.68, 0.024], [0.132 * settings.jawWidth, 0.105, 0.133], { segments: 24 });
  addSphere(root, "Cheek L", skin, [-0.097, 1.765, 0.079], [0.061 * faceShape.cheek, 0.052, 0.055], { segments: 16 });
  addSphere(root, "Cheek R", skin, [0.097, 1.765, 0.079], [0.061 * faceShape.cheek, 0.052, 0.055], { segments: 16 });

  for (const side of [-1, 1]) {
    const x = side * 0.065 * settings.eyeSpacing;
    addSphere(root, "Eye socket", skin, [x, 1.827, 0.130], [0.047 * settings.eyeSize, 0.032 * settings.eyeSize, 0.025], { segments: 16 });
    addSphere(root, "Eye white", eyeWhite, [x, 1.829, 0.151], [0.034 * settings.eyeSize, 0.022 * settings.eyeSize, 0.015], { segments: 16 });
    addSphere(root, "Iris", iris, [x, 1.829, 0.164], [0.014 * settings.eyeSize, 0.017 * settings.eyeSize, 0.007], { segments: 12 });
    addSphere(root, "Pupil", dark, [x, 1.829, 0.17], [0.006 * settings.eyeSize, 0.01 * settings.eyeSize, 0.004], { segments: 10 });
    const brow = addCapsuleBetween(root, "Eyebrow", hair, new THREE.Vector3(x - 0.038, 1.87, 0.14), new THREE.Vector3(x + 0.038, 1.877, 0.14), 0.009, 8);
    brow.quaternion.z += side * 0.04;
    addSphere(root, "Ear", skin, [side * 0.154, 1.79, 0.006], [0.035, 0.064, 0.032], { segments: 16 });
  }

  addCapsuleBetween(root, "Nose bridge", skin, new THREE.Vector3(0, 1.826, 0.129), new THREE.Vector3(0, 1.757, 0.176), 0.019 * settings.noseSize, 12);
  addSphere(root, "Nose tip", skin, [0, 1.755, 0.179], [0.029 * settings.noseSize, 0.023 * settings.noseSize, 0.03 * settings.noseSize], { segments: 14 });
  addSphere(root, "Lips", material("#995F5A", 0.42), [0, 1.716, 0.143], [0.051, 0.012, 0.018], { segments: 18 });

  const armLength = settings.armLength;
  const legLength = settings.legLength;
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Vector3(side * 0.32 * factors.shoulder, 1.48, 0);
    const elbow = new THREE.Vector3(side * 0.43, 1.08 * armLength, 0.01);
    const wrist = new THREE.Vector3(side * 0.45, 0.82 * armLength, 0.045);
    const hand = new THREE.Vector3(side * 0.46, 0.72 * armLength, 0.06);
    addCapsuleBetween(root, "Upper arm", skin, shoulder, elbow, 0.066, 18);
    addCapsuleBetween(root, "Forearm", skin, elbow, wrist, 0.045, 16);
    addSphere(root, "Hand", skin, hand.toArray() as [number, number, number], [0.044, 0.073, 0.028], { segments: 16 });
    for (let finger = -1; finger <= 2; finger += 1) {
      addCapsuleBetween(root, "Finger", skin, hand.clone().add(new THREE.Vector3(side * finger * 0.013, -0.027, 0.016)), hand.clone().add(new THREE.Vector3(side * finger * 0.017, -0.065, 0.019)), 0.009, 8);
    }

    const hip = new THREE.Vector3(side * 0.135 * factors.hip, 0.77, 0);
    const knee = new THREE.Vector3(side * 0.15, 0.43 * legLength, 0);
    const ankle = new THREE.Vector3(side * 0.155, 0.065 * legLength, 0);
    const foot = new THREE.Vector3(side * 0.155, 0.045 * legLength, 0.083);
    addCapsuleBetween(root, "Thigh", skin, hip, knee, 0.105 * factors.hip, 18);
    addCapsuleBetween(root, "Shin", skin, knee, ankle, 0.061, 16);
    addSphere(root, "Foot", skin, foot.toArray() as [number, number, number], [0.071, 0.045, 0.13], { segments: 16 });
  }

  const clothes = addClothing(root, settings, colors.clothing, factors);
  createHair(root, settings, colors.hair);
  root.scale.y = settings.bodyHeight;
  const modelCapabilities = {
    meshEditableBySettings: [
      "bodyHeight", "bodyBuild", "shoulderWidth", "chestWidth", "waistWidth", "hipWidth", "armLength", "legLength",
      "faceShape", "faceWidth", "jawWidth", "eyeSize", "eyeSpacing", "noseSize", "skinHex", "hairStyle", "hairLength",
      "hairVolume", "hairHex", "clothingStyle", "clothingMaterial", "clothingHex", "adultMode",
    ],
    materials: ["skin", "hair", "eyes", "fabric", "metal-trim"],
    contentMode: settings.adultMode ? "adult-opt-in" : "standard",
  };
  // Keep the historical userData.figural key for GLB consumers of older exports.
  root.userData.figural = modelCapabilities;
  root.userData["3d4me"] = modelCapabilities;
  // Keep the surface handles available for editor-specific finish tuning without flattening meshes.
  root.userData.materialNames = [skin.name || "skin", hair.name || "hair", clothes.cloth.name || "fabric", clothes.trim.name || "trim"];
  return root;
}

class FileReaderArrayBufferShim {
  result: ArrayBuffer | string | null = null;
  onloadend: (() => void) | null = null;
  onerror: ((event?: unknown) => void) | null = null;

  readAsArrayBuffer(blob: Blob) {
    void blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    }).catch((error) => this.onerror?.(error));
  }

  readAsDataURL(blob: Blob) {
    void blob.arrayBuffer().then((buffer) => {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      }
      this.result = `data:${blob.type};base64,${btoa(binary)}`;
      this.onloadend?.();
    }).catch((error) => this.onerror?.(error));
  }
}

function ensureExporterFileReader() {
  const globals = globalThis as typeof globalThis & { FileReader?: typeof FileReader };
  if (typeof globals.FileReader === "undefined") {
    globals.FileReader = FileReaderArrayBufferShim as unknown as typeof FileReader;
  }
}

export async function exportAvatarGlb(settings: CharacterSettings) {
  ensureExporterFileReader();
  const model = createAvatarModel(settings);
  try {
    const result = await new GLTFExporter().parseAsync(model, { binary: true, trs: true, onlyVisible: true });
    if (!(result instanceof ArrayBuffer) || result.byteLength < 32) throw new Error("The model exporter did not produce a valid binary GLB.");
    const view = new DataView(result);
    if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== result.byteLength) {
      throw new Error("The exported model failed GLB header validation.");
    }
    return result;
  } finally {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
      if (object instanceof THREE.Mesh && Array.isArray(object.material)) object.material.forEach((surface) => surface.dispose());
      else if (object instanceof THREE.Mesh) object.material.dispose();
    });
  }
}
