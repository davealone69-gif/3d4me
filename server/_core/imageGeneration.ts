import { storagePut } from "../storage";
import { removeImageBackground } from "./backgroundRemoval";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{ url?: string; b64Json?: string; mimeType?: string }>;
  storagePrefix: string;
  requireTransparent?: boolean;
};

export type GeneratedImageAsset = {
  url: string;
  key: string;
  mimeType: string;
  modelId: string;
  transparentVerified: boolean;
};

type ImageModelInfo = { model?: string; id?: string };

function platformConfig() {
  if (!ENV.manusApiUrl || !ENV.manusApiKey) {
    throw new Error("The configured Figural image service is unavailable.");
  }
  return {
    baseUrl: ENV.manusApiUrl.endsWith("/") ? ENV.manusApiUrl : `${ENV.manusApiUrl}/`,
    key: ENV.manusApiKey,
  };
}

function extensionForMime(mimeType: string) {
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  return "png";
}

function hasVerifiedAlpha(buffer: Buffer, mimeType: string) {
  if (mimeType.includes("png")) {
    // PNG IHDR color types 4 and 6 carry alpha. Palette PNG transparency would also contain tRNS,
    // but generated character art is expected to use true alpha pixels rather than a palette mask.
    return buffer.length > 25 && buffer.subarray(1, 4).toString("ascii") === "PNG" && [4, 6].includes(buffer[25]);
  }
  if (mimeType.includes("webp")) {
    // VP8X uses alpha bit 4 in its feature flags.
    return buffer.length > 21 && buffer.subarray(12, 16).toString("ascii") === "VP8X" && (buffer[20] & 0x10) !== 0;
  }
  return false;
}

async function listImageModels(): Promise<ImageModelInfo[]> {
  const { baseUrl, key } = platformConfig();
  const response = await fetch(new URL("images.v1.ImageService/ListModels", baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "connect-protocol-version": "1",
    },
    body: "{}",
  });
  if (!response.ok) throw new Error(`Image-model discovery failed (${response.status}).`);
  const body = (await response.json()) as { models?: ImageModelInfo[] };
  return body.models ?? [];
}

async function resolvePhotorealisticModel(): Promise<{ model: string; id: string }> {
  const models = await listImageModels();
  const preferred = models.find((model) => model.id?.toLowerCase().includes("gpt-image")) ?? models[0];
  if (!preferred?.model || !preferred.id) throw new Error("No usable image model is configured for this project.");
  return { model: preferred.model, id: preferred.id };
}

async function resolveImageBytes(image: { b64Json?: string; url?: string; mimeType?: string }) {
  if (image.b64Json) return Buffer.from(image.b64Json, "base64");
  if (image.url) {
    const response = await fetch(image.url);
    if (!response.ok) throw new Error("The image service returned an unreadable result.");
    return Buffer.from(await response.arrayBuffer());
  }
  throw new Error("The image service returned no image bytes.");
}

/**
 * Sends a real server-side request to the configured project ImageService, then transfers the
 * actual response bytes to managed storage. It never returns a placeholder result.
 */
export async function generateImage(options: GenerateImageOptions): Promise<GeneratedImageAsset> {
  const { baseUrl, key } = platformConfig();
  const model = await resolvePhotorealisticModel();
  const response = await fetch(new URL("images.v1.ImageService/GenerateImage", baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "connect-protocol-version": "1",
    },
    body: JSON.stringify({
      prompt: options.prompt,
      originalImages: options.originalImages ?? [],
      model: model.model,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Image generation failed (${response.status})${detail ? `: ${detail.slice(0, 500)}` : ""}`);
  }

  const body = (await response.json()) as {
    image?: { b64Json?: string; url?: string; mimeType?: string };
    error?: { message?: string };
  };
  if (body.error?.message) throw new Error(body.error.message);
  if (!body.image) throw new Error("Image generation completed without an image result.");

  let mimeType = body.image.mimeType || "image/png";
  let bytes = await resolveImageBytes(body.image);
  if (bytes.length === 0) throw new Error("Image generation completed with an empty asset.");

  if (options.requireTransparent && !hasVerifiedAlpha(bytes, mimeType)) {
    bytes = await removeImageBackground(bytes, mimeType);
    mimeType = "image/png";
  }
  const transparentVerified = hasVerifiedAlpha(bytes, mimeType);
  if (options.requireTransparent && !transparentVerified) {
    throw new Error("The local alpha-matting stage did not produce a verified transparent PNG.");
  }
  const { key: storageKey, url } = await storagePut(
    `${options.storagePrefix.replace(/\/+$/, "")}/render.${extensionForMime(mimeType)}`,
    bytes,
    mimeType,
  );

  return { url, key: storageKey, mimeType, modelId: model.id, transparentVerified };
}
