import { and, desc, eq, max } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

import {
  characterPresets,
  characterProjects,
  characterRenders,
  characterVersions,
  exportReceipts,
  type CharacterProject,
  type CharacterRender,
  type InsertUser,
  users,
} from "../drizzle/schema";
import type { CharacterSettings, RenderView } from "../shared/character";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch {
      console.warn("[Database] Failed to connect");
      _db = null;
    }
  }
  return _db;
}

async function databaseOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("The Figural project database is unavailable. Retry once the service is ready.");
  return db;
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listCharacterProjects(ownerToken: string) {
  const db = await databaseOrThrow();
  return db
    .select()
    .from(characterProjects)
    .where(eq(characterProjects.ownerToken, ownerToken))
    .orderBy(desc(characterProjects.updatedAt));
}

export async function getCharacterProject(ownerToken: string, projectId: string) {
  const db = await databaseOrThrow();
  const rows = await db
    .select()
    .from(characterProjects)
    .where(and(eq(characterProjects.ownerToken, ownerToken), eq(characterProjects.id, projectId)))
    .limit(1);
  return rows[0];
}

export async function createCharacterProject(input: {
  ownerToken: string;
  name: string;
  settings: CharacterSettings;
}): Promise<CharacterProject> {
  const db = await databaseOrThrow();
  const projectId = id("project");
  const now = new Date();
  const project = {
    id: projectId,
    ownerToken: input.ownerToken,
    name: input.name,
    age: input.settings.age,
    identitySeed: input.settings.identitySeed,
    settingsJson: JSON.stringify(input.settings),
    adultAttestedAt: now,
  };
  await db.insert(characterProjects).values(project);
  await db.insert(characterVersions).values({
    id: id("version"),
    projectId,
    ownerToken: input.ownerToken,
    version: 1,
    label: "Initial character specification",
    settingsJson: JSON.stringify(input.settings),
  });
  const stored = await getCharacterProject(input.ownerToken, projectId);
  if (!stored) throw new Error("Character project was not persisted.");
  return stored;
}

export async function updateCharacterProject(input: {
  ownerToken: string;
  projectId: string;
  name: string;
  settings: CharacterSettings;
  label: string;
}) {
  const db = await databaseOrThrow();
  const existing = await getCharacterProject(input.ownerToken, input.projectId);
  if (!existing) return undefined;

  await db
    .update(characterProjects)
    .set({
      name: input.name,
      age: input.settings.age,
      identitySeed: input.settings.identitySeed,
      settingsJson: JSON.stringify(input.settings),
    })
    .where(and(eq(characterProjects.id, input.projectId), eq(characterProjects.ownerToken, input.ownerToken)));

  const currentVersion = await db
    .select({ current: max(characterVersions.version) })
    .from(characterVersions)
    .where(and(eq(characterVersions.projectId, input.projectId), eq(characterVersions.ownerToken, input.ownerToken)));
  const nextVersion = (currentVersion[0]?.current ?? 0) + 1;
  await db.insert(characterVersions).values({
    id: id("version"),
    projectId: input.projectId,
    ownerToken: input.ownerToken,
    version: nextVersion,
    label: input.label,
    settingsJson: JSON.stringify(input.settings),
  });
  return getCharacterProject(input.ownerToken, input.projectId);
}

export async function listCharacterVersions(ownerToken: string, projectId: string) {
  const db = await databaseOrThrow();
  return db
    .select()
    .from(characterVersions)
    .where(and(eq(characterVersions.projectId, projectId), eq(characterVersions.ownerToken, ownerToken)))
    .orderBy(desc(characterVersions.version));
}

export async function listCharacterPresets(ownerToken: string) {
  const db = await databaseOrThrow();
  return db
    .select()
    .from(characterPresets)
    .where(eq(characterPresets.ownerToken, ownerToken))
    .orderBy(desc(characterPresets.updatedAt));
}

export async function createCharacterPreset(ownerToken: string, name: string, settings: CharacterSettings) {
  const db = await databaseOrThrow();
  const preset = {
    id: id("preset"),
    ownerToken,
    name,
    settingsJson: JSON.stringify(settings),
  };
  await db.insert(characterPresets).values(preset);
  return preset;
}

export async function createRenderJob(input: {
  ownerToken: string;
  projectId: string;
  view: RenderView;
  sourceMode: "none" | "reference" | "project-anchor";
  transparencyRequested: boolean;
  provenance: Record<string, unknown>;
}) {
  const db = await databaseOrThrow();
  const render = {
    id: id("render"),
    ownerToken: input.ownerToken,
    projectId: input.projectId,
    view: input.view,
    status: "queued" as const,
    sourceMode: input.sourceMode,
    transparencyRequested: input.transparencyRequested,
    provenanceJson: JSON.stringify(input.provenance),
  };
  await db.insert(characterRenders).values(render);
  return render;
}

export async function markRenderRendering(ownerToken: string, renderId: string) {
  const db = await databaseOrThrow();
  await db
    .update(characterRenders)
    .set({ status: "rendering", errorMessage: null })
    .where(and(eq(characterRenders.id, renderId), eq(characterRenders.ownerToken, ownerToken)));
}

export async function markRenderCompleted(input: {
  ownerToken: string;
  renderId: string;
  imageUrl: string;
  storageKey: string;
  mimeType: string;
  modelId: string;
  transparentVerified: boolean;
  provenance: Record<string, unknown>;
}) {
  const db = await databaseOrThrow();
  await db
    .update(characterRenders)
    .set({
      status: "complete",
      imageUrl: input.imageUrl,
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      modelId: input.modelId,
      transparentVerified: input.transparentVerified,
      errorMessage: null,
      provenanceJson: JSON.stringify(input.provenance),
      completedAt: new Date(),
    })
    .where(and(eq(characterRenders.id, input.renderId), eq(characterRenders.ownerToken, input.ownerToken)));
}

export async function markRenderFailed(ownerToken: string, renderId: string, errorMessage: string) {
  const db = await databaseOrThrow();
  await db
    .update(characterRenders)
    .set({ status: "failed", errorMessage: errorMessage.slice(0, 1200), completedAt: new Date() })
    .where(and(eq(characterRenders.id, renderId), eq(characterRenders.ownerToken, ownerToken)));
}

export async function listCharacterRenders(ownerToken: string, projectId?: string) {
  const db = await databaseOrThrow();
  const where = projectId
    ? and(eq(characterRenders.ownerToken, ownerToken), eq(characterRenders.projectId, projectId))
    : eq(characterRenders.ownerToken, ownerToken);
  return db.select().from(characterRenders).where(where).orderBy(desc(characterRenders.createdAt));
}

export async function getCharacterRender(ownerToken: string, renderId: string): Promise<CharacterRender | undefined> {
  const db = await databaseOrThrow();
  const rows = await db
    .select()
    .from(characterRenders)
    .where(and(eq(characterRenders.ownerToken, ownerToken), eq(characterRenders.id, renderId)))
    .limit(1);
  return rows[0];
}

export async function getLatestCompletedRender(ownerToken: string, projectId: string) {
  const db = await databaseOrThrow();
  const rows = await db
    .select()
    .from(characterRenders)
    .where(
      and(
        eq(characterRenders.ownerToken, ownerToken),
        eq(characterRenders.projectId, projectId),
        eq(characterRenders.status, "complete"),
      ),
    )
    .orderBy(desc(characterRenders.completedAt))
    .limit(1);
  return rows[0];
}

export async function createExportReceipt(input: {
  ownerToken: string;
  renderId: string;
  projectId: string;
  provenanceIncluded: boolean;
}) {
  const db = await databaseOrThrow();
  const receipt = {
    id: id("export"),
    ownerToken: input.ownerToken,
    renderId: input.renderId,
    projectId: input.projectId,
    rightsConfirmed: true,
    provenanceIncluded: input.provenanceIncluded,
  };
  await db.insert(exportReceipts).values(receipt);
  return receipt;
}
