import { z } from "zod";

export const renderViews = ["front", "side", "rear", "three-quarter"] as const;
export type RenderView = (typeof renderViews)[number];

export const clothingMaterials = ["cotton", "silk", "satin", "denim", "leather", "latex"] as const;
export const clothingStyles = ["tailored", "casual", "editorial", "formal-dress", "swimwear", "lingerie"] as const;

export const choiceSets = {
  bodyBuild: ["slender", "athletic", "curvy", "strong", "soft"],
  faceShape: ["oval", "heart", "square", "diamond", "round"],
  skinTone: ["porcelain", "warm-beige", "olive", "golden-brown", "deep-brown", "ebony"],
  hairStyle: ["sleek-bob", "long-waves", "curly-volume", "braided-updo", "short-crop"],
  hairColor: ["black", "dark-brown", "chestnut", "blonde", "auburn", "silver"],
  eyeColor: ["brown", "hazel", "green", "blue", "grey"],
  wardrobe: ["tailored-evening", "mature-casual", "fashion-editorial", "fantasy-formal", "resort-editorial"],
  expression: ["confident", "serene", "playful", "intense", "soft-smile"],
  lighting: ["cinematic-studio", "golden-hour", "neon-noir", "soft-window", "editorial-flash"],
  cameraAngle: ["eye-level", "low-angle", "three-quarter", "close-portrait", "full-body"],
  sceneBackground: ["studio-cyclorama", "luxury-interior", "night-city", "sunset-terrace", "minimal-abstract"],
  outputBackground: ["studio", "transparent"],
} as const;

export type ChoiceSetKey = keyof typeof choiceSets;

export type Choice = { id: string; label: string };

export const studioChoices: Record<ChoiceSetKey, Choice[]> = {
  bodyBuild: [
    { id: "slender", label: "Slender" },
    { id: "athletic", label: "Athletic" },
    { id: "curvy", label: "Curvy" },
    { id: "strong", label: "Strong" },
    { id: "soft", label: "Soft" },
  ],
  faceShape: [
    { id: "oval", label: "Oval" },
    { id: "heart", label: "Heart" },
    { id: "square", label: "Square" },
    { id: "diamond", label: "Diamond" },
    { id: "round", label: "Round" },
  ],
  skinTone: [
    { id: "porcelain", label: "Porcelain" },
    { id: "warm-beige", label: "Warm beige" },
    { id: "olive", label: "Olive" },
    { id: "golden-brown", label: "Golden brown" },
    { id: "deep-brown", label: "Deep brown" },
    { id: "ebony", label: "Ebony" },
  ],
  hairStyle: [
    { id: "sleek-bob", label: "Sleek bob" },
    { id: "long-waves", label: "Long waves" },
    { id: "curly-volume", label: "Curly volume" },
    { id: "braided-updo", label: "Braided updo" },
    { id: "short-crop", label: "Short crop" },
  ],
  hairColor: [
    { id: "black", label: "Black" },
    { id: "dark-brown", label: "Dark brown" },
    { id: "chestnut", label: "Chestnut" },
    { id: "blonde", label: "Blonde" },
    { id: "auburn", label: "Auburn" },
    { id: "silver", label: "Silver" },
  ],
  eyeColor: [
    { id: "brown", label: "Brown" },
    { id: "hazel", label: "Hazel" },
    { id: "green", label: "Green" },
    { id: "blue", label: "Blue" },
    { id: "grey", label: "Grey" },
  ],
  wardrobe: [
    { id: "tailored-evening", label: "Tailored evening" },
    { id: "mature-casual", label: "Mature casual" },
    { id: "fashion-editorial", label: "Fashion editorial" },
    { id: "fantasy-formal", label: "Fantasy formal" },
    { id: "resort-editorial", label: "Resort editorial" },
  ],
  expression: [
    { id: "confident", label: "Confident" },
    { id: "serene", label: "Serene" },
    { id: "playful", label: "Playful" },
    { id: "intense", label: "Intense" },
    { id: "soft-smile", label: "Soft smile" },
  ],
  lighting: [
    { id: "cinematic-studio", label: "Cinematic studio" },
    { id: "golden-hour", label: "Golden hour" },
    { id: "neon-noir", label: "Neon noir" },
    { id: "soft-window", label: "Soft window" },
    { id: "editorial-flash", label: "Editorial flash" },
  ],
  cameraAngle: [
    { id: "eye-level", label: "Eye level" },
    { id: "low-angle", label: "Low angle" },
    { id: "three-quarter", label: "Three-quarter" },
    { id: "close-portrait", label: "Close portrait" },
    { id: "full-body", label: "Full body" },
  ],
  sceneBackground: [
    { id: "studio-cyclorama", label: "Studio cyclorama" },
    { id: "luxury-interior", label: "Luxury interior" },
    { id: "night-city", label: "Night city" },
    { id: "sunset-terrace", label: "Sunset terrace" },
    { id: "minimal-abstract", label: "Minimal abstract" },
  ],
  outputBackground: [
    { id: "studio", label: "Studio background" },
    { id: "transparent", label: "Transparent cutout" },
  ],
};

export const characterSettingsSchema = z
  .object({
    age: z.number().int().min(21).max(80),
    bodyBuild: z.enum(choiceSets.bodyBuild),
    faceShape: z.enum(choiceSets.faceShape),
    skinTone: z.enum(choiceSets.skinTone),
    hairStyle: z.enum(choiceSets.hairStyle),
    hairColor: z.enum(choiceSets.hairColor),
    eyeColor: z.enum(choiceSets.eyeColor),
    wardrobe: z.enum(choiceSets.wardrobe),
    expression: z.enum(choiceSets.expression),
    lighting: z.enum(choiceSets.lighting),
    cameraAngle: z.enum(choiceSets.cameraAngle),
    sceneBackground: z.enum(choiceSets.sceneBackground),
  outputBackground: z.enum(choiceSets.outputBackground),
  identitySeed: z.string().trim().min(8).max(100),
  bodyHeight: z.number().min(0.82).max(1.18).default(1),
  shoulderWidth: z.number().min(0.75).max(1.3).default(1),
  chestWidth: z.number().min(0.72).max(1.32).default(1),
  waistWidth: z.number().min(0.7).max(1.3).default(1),
  hipWidth: z.number().min(0.72).max(1.35).default(1),
  armLength: z.number().min(0.8).max(1.2).default(1),
  legLength: z.number().min(0.8).max(1.2).default(1),
  faceWidth: z.number().min(0.78).max(1.22).default(1),
  jawWidth: z.number().min(0.7).max(1.25).default(1),
  eyeSize: z.number().min(0.75).max(1.3).default(1),
  eyeSpacing: z.number().min(0.8).max(1.25).default(1),
  noseSize: z.number().min(0.75).max(1.25).default(1),
  hairLength: z.number().min(0.15).max(1).default(0.62),
  hairVolume: z.number().min(0.65).max(1.4).default(1),
  clothingStyle: z.enum(clothingStyles).default("editorial"),
  clothingMaterial: z.enum(clothingMaterials).default("silk"),
  skinHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#C99378"),
  hairHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#382720"),
  clothingHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#393452"),
  adultMode: z.boolean().default(false),
  })
  .strict();

export type CharacterSettings = z.infer<typeof characterSettingsSchema>;

export const defaultCharacterSettings: CharacterSettings = {
  age: 28,
  bodyBuild: "athletic",
  faceShape: "oval",
  skinTone: "warm-beige",
  hairStyle: "long-waves",
  hairColor: "dark-brown",
  eyeColor: "hazel",
  wardrobe: "fashion-editorial",
  expression: "confident",
  lighting: "cinematic-studio",
  cameraAngle: "three-quarter",
  sceneBackground: "studio-cyclorama",
  outputBackground: "studio",
  identitySeed: "figural-character-anchor",
  bodyHeight: 1,
  shoulderWidth: 1,
  chestWidth: 1,
  waistWidth: 1,
  hipWidth: 1,
  armLength: 1,
  legLength: 1,
  faceWidth: 1,
  jawWidth: 1,
  eyeSize: 1,
  eyeSpacing: 1,
  noseSize: 1,
  hairLength: 0.62,
  hairVolume: 1,
  clothingStyle: "editorial",
  clothingMaterial: "silk",
  skinHex: "#C99378",
  hairHex: "#382720",
  clothingHex: "#393452",
  adultMode: false,
};

export function parseCharacterSettings(value: unknown): CharacterSettings {
  const parsed = characterSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultCharacterSettings;
}

export const adultSafetyAttestationSchema = z.object({
  isFictionalAdult: z.literal(true),
  isAtLeastTwentyOne: z.literal(true),
  hasRightsAndConsent: z.literal(true),
  noMinorOrNonConsensualReplica: z.literal(true),
});

export type AdultSafetyAttestation = z.infer<typeof adultSafetyAttestationSchema>;

export function readableView(view: RenderView) {
  return (
    {
      front: "Front",
      side: "Side",
      rear: "Rear",
      "three-quarter": "Three-quarter",
    } as const
  )[view];
}
