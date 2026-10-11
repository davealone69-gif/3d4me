import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table retained for the optional starter OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * A device-scoped project. Figural does not require a customer account, so an opaque token
 * stored on the creator's device scopes projects without putting a public gallery in the app.
 */
export const characterProjects = mysqlTable(
  "character_projects",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    ownerToken: varchar("ownerToken", { length: 180 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    age: int("age").notNull(),
    identitySeed: varchar("identitySeed", { length: 100 }).notNull(),
    settingsJson: text("settingsJson").notNull(),
    adultAttestedAt: timestamp("adultAttestedAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("character_projects_owner_updated_idx").on(table.ownerToken, table.updatedAt)],
);

/** Immutable project settings snapshots for version history and reusable generation provenance. */
export const characterVersions = mysqlTable(
  "character_versions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    projectId: varchar("projectId", { length: 64 }).notNull(),
    ownerToken: varchar("ownerToken", { length: 180 }).notNull(),
    version: int("version").notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    settingsJson: text("settingsJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("character_versions_project_version_idx").on(table.projectId, table.version),
    index("character_versions_owner_idx").on(table.ownerToken),
  ],
);

/** Reusable saved character settings available only to the device that created them. */
export const characterPresets = mysqlTable(
  "character_presets",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    ownerToken: varchar("ownerToken", { length: 180 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    settingsJson: text("settingsJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("character_presets_owner_updated_idx").on(table.ownerToken, table.updatedAt)],
);

/** A real renderer job and its durable stored result, never a fabricated completion record. */
export const characterRenders = mysqlTable(
  "character_renders",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    projectId: varchar("projectId", { length: 64 }).notNull(),
    ownerToken: varchar("ownerToken", { length: 180 }).notNull(),
    view: mysqlEnum("view", ["front", "side", "rear", "portrait", "pose", "three-quarter"]).notNull(),
    status: mysqlEnum("status", ["queued", "rendering", "complete", "failed"]).default("queued").notNull(),
    sourceMode: mysqlEnum("sourceMode", ["none", "reference", "project-anchor"]).default("none").notNull(),
    imageUrl: text("imageUrl"),
    storageKey: varchar("storageKey", { length: 512 }),
    mimeType: varchar("mimeType", { length: 100 }),
    modelId: varchar("modelId", { length: 160 }),
    transparencyRequested: boolean("transparencyRequested").default(false).notNull(),
    transparentVerified: boolean("transparentVerified").default(false).notNull(),
    errorMessage: text("errorMessage"),
    provenanceJson: text("provenanceJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  (table) => [
    index("character_renders_owner_created_idx").on(table.ownerToken, table.createdAt),
    index("character_renders_project_created_idx").on(table.projectId, table.createdAt),
  ],
);

/** An auditable, user-confirmed export event for a completed stored asset. */
export const exportReceipts = mysqlTable(
  "export_receipts",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    renderId: varchar("renderId", { length: 64 }).notNull(),
    projectId: varchar("projectId", { length: 64 }).notNull(),
    ownerToken: varchar("ownerToken", { length: 180 }).notNull(),
    rightsConfirmed: boolean("rightsConfirmed").notNull(),
    provenanceIncluded: boolean("provenanceIncluded").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("export_receipts_owner_created_idx").on(table.ownerToken, table.createdAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CharacterProject = typeof characterProjects.$inferSelect;
export type CharacterRender = typeof characterRenders.$inferSelect;
export type CharacterPreset = typeof characterPresets.$inferSelect;
