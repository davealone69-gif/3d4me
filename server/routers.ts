import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  adultSafetyAttestationSchema,
  characterSettingsSchema,
  referenceImageSchema,
  renderViews,
  type CharacterSettings,
  type RenderView,
} from "../shared/character";
import {
  createCharacterPreset,
  createCharacterProject,
  createExportReceipt,
  createRenderJob,
  getCharacterProject,
  getCharacterRender,
  getLatestCompletedRender,
  listCharacterPresets,
  listCharacterProjects,
  listCharacterRenders,
  listCharacterVersions,
  markRenderCompleted,
  markRenderFailed,
  markRenderRendering,
  updateCharacterProject,
} from "./db";
import { generateImage } from "./_core/imageGeneration";
import { storageGetSignedUrl, storagePut } from "./storage";
import { getSessionCookieName, getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const ownerTokenSchema = z.string().trim().min(24).max(180).regex(/^fg_[a-z0-9_]+$/i);
const projectNameSchema = z.string().trim().min(2).max(100);

function humanize(value: string) {
  return value.replace(/-/g, " ");
}

function buildRenderPrompt(settings: CharacterSettings, view: RenderView, hasReference: boolean) {
  const viewDirections: Record<RenderView, string> = {
    front: "straight-on full-body front view, arms naturally relaxed, full figure visible",
    side: "true left-side full-body reference view, full figure visible",
    rear: "rear full-body reference view, tasteful fully clothed styling, full figure visible",
    portrait: "tight three-quarter portrait focused on facial structure, skin texture, hair, and eyes",
    pose: "editorial full-body pose with natural anatomy and a confident balanced stance",
  };
  const background =
    settings.outputBackground === "transparent"
      ? "isolated character on a genuine transparent alpha background, no floor, no backdrop, no cast shadow"
      : `${humanize(settings.sceneBackground)} background`;
  const referenceClause = hasReference
    ? "Use the authorized input image only as a visual reference for selected traits. Carry over high-level hair texture, color palette, face geometry, and proportions when appropriate, but create a distinct fictional adult identity rather than reproducing an identifiable person exactly."
    : "Maintain the same fictional adult identity anchors throughout this project: face geometry, hair texture, skin tone, eye color, and body proportions.";

  return [
    "Create a photorealistic, high-resolution, 3D-like digital character-reference render for a lawful mature creative workflow.",
    `Subject: one fictional consenting adult aged ${settings.age}, clearly over 21, with a ${humanize(settings.bodyBuild)} build, ${humanize(settings.faceShape)} face, ${humanize(settings.skinTone)} skin, ${humanize(settings.hairColor)} ${humanize(settings.hairStyle)} hair, and ${humanize(settings.eyeColor)} eyes.`,
    `Wardrobe: ${humanize(settings.wardrobe)}. Expression: ${humanize(settings.expression)}. Lighting: ${humanize(settings.lighting)}. Camera: ${humanize(settings.cameraAngle)}.`,
    `View direction: ${viewDirections[view]}. Scene: ${background}.`,
    referenceClause,
    "Use natural adult anatomy, physically based skin and fabric materials, accurate hands, cinematic depth, and clean high-detail character design. The character is fully clothed. Do not depict a child, teenager, ambiguous youth, real celebrity, recognizable unconsenting person, nudity, a sexual act, coercion, text, logo, or watermark.",
  ].join(" ");
}

async function addPreviewUrl<T extends { status: string; storageKey: string | null }>(render: T) {
  if (render.status !== "complete" || !render.storageKey) return { ...render, previewUrl: null };
  try {
    return { ...render, previewUrl: await storageGetSignedUrl(render.storageKey) };
  } catch {
    return { ...render, previewUrl: null };
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The renderer returned an unknown error.";
}

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
      .input(
        z.object({
          ownerToken: ownerTokenSchema,
          name: projectNameSchema,
          settings: characterSettingsSchema,
          safety: adultSafetyAttestationSchema,
        }),
      )
      .mutation(async ({ input }) => {
        adultSafetyAttestationSchema.parse(input.safety);
        const identitySeed = `figural_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
        return createCharacterProject({
          ownerToken: input.ownerToken,
          name: input.name,
          settings: { ...input.settings, identitySeed },
        });
      }),

    updateProject: publicProcedure
      .input(
        z.object({
          ownerToken: ownerTokenSchema,
          projectId: z.string().min(1).max(64),
          name: projectNameSchema,
          settings: characterSettingsSchema,
          label: z.string().trim().min(2).max(120).default("Updated character specification"),
          safety: adultSafetyAttestationSchema,
        }),
      )
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

    listRenders: publicProcedure
      .input(z.object({ ownerToken: ownerTokenSchema, projectId: z.string().min(1).max(64).optional() }))
      .query(async ({ input }) => {
        const renders = await listCharacterRenders(input.ownerToken, input.projectId);
        return Promise.all(renders.map(addPreviewUrl));
      }),

    render: publicProcedure
      .input(
        z.object({
          ownerToken: ownerTokenSchema,
          projectId: z.string().min(1).max(64),
          view: z.enum(renderViews),
          settings: characterSettingsSchema,
          safety: adultSafetyAttestationSchema,
          referenceImage: referenceImageSchema.optional(),
        }),
      )
      .mutation(async ({ input }) => {
        adultSafetyAttestationSchema.parse(input.safety);
        const project = await getCharacterProject(input.ownerToken, input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Save or select a character project before rendering." });

        const anchor = await getLatestCompletedRender(input.ownerToken, input.projectId);
        const sourceMode = input.referenceImage ? "reference" : anchor?.storageKey ? "project-anchor" : "none";
        const render = await createRenderJob({
          ownerToken: input.ownerToken,
          projectId: input.projectId,
          view: input.view,
          sourceMode,
          transparencyRequested: input.settings.outputBackground === "transparent",
          provenance: {
            product: "Figural Character Studio",
            label: "fictional-adult-character-reference",
            safetyAttested: true,
            referenceAttested: Boolean(input.referenceImage),
            sourceMode,
            requestedView: input.view,
            outputBackground: input.settings.outputBackground,
          },
        });

        try {
          await markRenderRendering(input.ownerToken, render.id);
          const originalImages: Array<{ url?: string; b64Json?: string; mimeType?: string }> = [];
          if (input.referenceImage) {
            originalImages.push({ b64Json: input.referenceImage.b64Json, mimeType: input.referenceImage.mimeType });
          }
          if (anchor?.storageKey) {
            originalImages.push({ url: await storageGetSignedUrl(anchor.storageKey), mimeType: anchor.mimeType ?? undefined });
          }

          const generated = await generateImage({
            prompt: buildRenderPrompt(input.settings, input.view, Boolean(input.referenceImage)),
            originalImages,
            storagePrefix: `characters/${project.id}`,
            requireTransparent: input.settings.outputBackground === "transparent",
          });

          if (input.settings.outputBackground === "transparent" && !generated.transparentVerified) {
            throw new Error("The renderer did not return a verified alpha channel. Choose Studio background or retry the transparent cutout request.");
          }

          const provenance = {
            product: "Figural Character Studio",
            label: "fictional-adult-character-reference",
            safetyAttested: true,
            referenceAttested: Boolean(input.referenceImage),
            sourceMode,
            requestedView: input.view,
            outputBackground: input.settings.outputBackground,
            transparencyVerified: generated.transparentVerified,
            modelId: generated.modelId,
            completedAt: new Date().toISOString(),
          };
          await markRenderCompleted({
            ownerToken: input.ownerToken,
            renderId: render.id,
            imageUrl: generated.url,
            storageKey: generated.key,
            mimeType: generated.mimeType,
            modelId: generated.modelId,
            transparentVerified: generated.transparentVerified,
            provenance,
          });
          const completed = await getCharacterRender(input.ownerToken, render.id);
          if (!completed) throw new Error("The completed render could not be retrieved.");
          return addPreviewUrl(completed);
        } catch (error) {
          const message = errorMessage(error);
          await markRenderFailed(input.ownerToken, render.id, message);
          throw new TRPCError({ code: "BAD_REQUEST", message });
        }
      }),

    prepareExport: publicProcedure
      .input(
        z.object({
          ownerToken: ownerTokenSchema,
          renderId: z.string().min(1).max(64),
          rightsConfirmed: z.literal(true),
          provenanceIncluded: z.boolean(),
        }),
      )
      .mutation(async ({ input }) => {
        const render = await getCharacterRender(input.ownerToken, input.renderId);
        if (!render || render.status !== "complete" || !render.storageKey) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Only a completed stored render can be exported." });
        }
        const exportReceipt = await createExportReceipt({
          ownerToken: input.ownerToken,
          renderId: render.id,
          projectId: render.projectId,
          provenanceIncluded: input.provenanceIncluded,
        });
        const provenance = JSON.parse(render.provenanceJson) as Record<string, unknown>;
        const receipt = {
          ...provenance,
          renderId: render.id,
          projectId: render.projectId,
          exportedAt: new Date().toISOString(),
          exportReceiptId: exportReceipt.id,
          rightsConfirmed: true,
          transparentVerified: render.transparentVerified,
        };
        let provenanceUrl: string | null = null;
        if (input.provenanceIncluded) {
          const provenanceAsset = await storagePut(
            `exports/${render.projectId}/${render.id}-provenance.json`,
            JSON.stringify(receipt, null, 2),
            "application/json",
          );
          provenanceUrl = await storageGetSignedUrl(provenanceAsset.key);
        }
        return {
          downloadUrl: await storageGetSignedUrl(render.storageKey),
          provenanceUrl,
          fileName: `figural-${render.view}-${render.id}.${render.mimeType?.includes("webp") ? "webp" : render.mimeType?.includes("jpeg") ? "jpg" : "png"}`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
