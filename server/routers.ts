import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  adultSafetyAttestationSchema,
  characterSettingsSchema,
} from "../shared/character";
import {
  createCharacterPreset,
  createCharacterProject,
  getCharacterProject,
  listCharacterPresets,
  listCharacterProjects,
  listCharacterVersions,
  updateCharacterProject,
} from "./db";
import { getSessionCookieName, getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const ownerTokenSchema = z.string().trim().min(24).max(180).regex(/^fg_[a-z0-9_]+$/i);
const projectNameSchema = z.string().trim().min(2).max(100);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(getSessionCookieName(ctx.req), { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  character: router({
    listProjects: publicProcedure.input(z.object({ ownerToken: ownerTokenSchema })).query(({ input }) => listCharacterProjects(input.ownerToken)),

    getProject: publicProcedure
      .input(z.object({ ownerToken: ownerTokenSchema, projectId: z.string().min(1).max(64) }))
      .query(async ({ input }) => {
        const project = await getCharacterProject(input.ownerToken, input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Character project not found on this device." });
        return project;
      }),

    createProject: publicProcedure
      .input(z.object({ ownerToken: ownerTokenSchema, name: projectNameSchema, settings: characterSettingsSchema, safety: adultSafetyAttestationSchema }))
      .mutation(({ input }) => {
        adultSafetyAttestationSchema.parse(input.safety);
        const identitySeed = `figural_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
        return createCharacterProject({
          ownerToken: input.ownerToken,
          name: input.name,
          settings: { ...input.settings, identitySeed },
        });
      }),

    updateProject: publicProcedure
      .input(z.object({
        ownerToken: ownerTokenSchema,
        projectId: z.string().min(1).max(64),
        name: projectNameSchema,
        settings: characterSettingsSchema,
        label: z.string().trim().min(2).max(120).default("Updated character specification"),
        safety: adultSafetyAttestationSchema,
      }))
      .mutation(async ({ input }) => {
        adultSafetyAttestationSchema.parse(input.safety);
        const updated = await updateCharacterProject(input);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Character project not found on this device." });
        return updated;
      }),

    listVersions: publicProcedure
      .input(z.object({ ownerToken: ownerTokenSchema, projectId: z.string().min(1).max(64) }))
      .query(({ input }) => listCharacterVersions(input.ownerToken, input.projectId)),

    listPresets: publicProcedure.input(z.object({ ownerToken: ownerTokenSchema })).query(({ input }) => listCharacterPresets(input.ownerToken)),

    createPreset: publicProcedure
      .input(z.object({ ownerToken: ownerTokenSchema, name: projectNameSchema, settings: characterSettingsSchema, safety: adultSafetyAttestationSchema }))
      .mutation(({ input }) => {
        adultSafetyAttestationSchema.parse(input.safety);
        return createCharacterPreset(input.ownerToken, input.name, input.settings);
      }),
  }),
});

export type AppRouter = typeof appRouter;
