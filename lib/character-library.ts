import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";

import { characterSettingsSchema, parseCharacterSettings, type CharacterSettings } from "../shared/character";

export const localProjectsKey = "figural.local.characters.v1";
export const localViewsKey = "figural.local.views.v1";

export interface LocalCharacterProject {
  id: string;
  name: string;
  settings: CharacterSettings;
  createdAt: string;
  updatedAt: string;
}

export interface LocalViewImage {
  id: string;
  projectId: string;
  projectName: string;
  view: "front" | "side" | "rear" | "three-quarter";
  uri: string;
  fileName: string;
  createdAt: string;
  width: number;
  height: number;
}

const localProjectSchema = z.object({
  id: z.string().min(1).max(160),
  name: z.string().trim().min(1).max(100),
  settings: z.unknown(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

const localViewImageSchema = z.object({
  id: z.string().min(1).max(160),
  projectId: z.string().min(1).max(160),
  projectName: z.string().trim().min(1).max(100),
  view: z.enum(["front", "side", "rear", "three-quarter"]),
  uri: z.string().min(1).max(20_000_000),
  fileName: z.string().min(1).max(180),
  createdAt: z.string().datetime(),
  width: z.number().int().positive().max(16_384),
  height: z.number().int().positive().max(16_384),
});

const backupSchema = z.object({
  format: z.literal("figural-character-library"),
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  projects: z.array(localProjectSchema.extend({ settings: characterSettingsSchema })).min(1),
}).strict();

function safeParseStored<T>(text: string | null, schema: z.ZodType<T>): T[] {
  if (!text) return [];
  try {
    const value: unknown = JSON.parse(text);
    const result = z.array(schema).safeParse(value);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export async function loadLocalProjects() {
  const values = safeParseStored(await AsyncStorage.getItem(localProjectsKey), localProjectSchema);
  return values.map((item): LocalCharacterProject => ({
    id: item.id,
    name: item.name,
    settings: parseCharacterSettings(item.settings),
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? new Date().toISOString(),
  }));
}

export async function writeLocalProjects(projects: LocalCharacterProject[]) {
  await AsyncStorage.setItem(localProjectsKey, JSON.stringify(projects));
}

export async function loadLocalViewImages() {
  return safeParseStored(await AsyncStorage.getItem(localViewsKey), localViewImageSchema) as LocalViewImage[];
}

export async function writeLocalViewImages(images: LocalViewImage[]) {
  await AsyncStorage.setItem(localViewsKey, JSON.stringify(images));
}

export function createLocalLibraryBackup(projects: LocalCharacterProject[]) {
  return JSON.stringify({
    format: "figural-character-library",
    version: 1,
    exportedAt: new Date().toISOString(),
    projects,
  }, null, 2);
}

export function parseLocalLibraryBackup(text: string) {
  const value: unknown = JSON.parse(text);
  const parsed = backupSchema.parse(value);
  return parsed.projects.map((item): LocalCharacterProject => ({
    id: item.id,
    name: item.name,
    settings: parseCharacterSettings(item.settings),
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? new Date().toISOString(),
  }));
}
