import { pipeline, RawImage } from "@huggingface/transformers";

type BackgroundRemovalPipeline = (input: InstanceType<typeof RawImage>) => Promise<InstanceType<typeof RawImage> | InstanceType<typeof RawImage>[]>;

let segmenterPromise: Promise<BackgroundRemovalPipeline> | null = null;

async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = pipeline("background-removal", "onnx-community/MVANet-ONNX") as unknown as Promise<BackgroundRemovalPipeline>;
  }
  return segmenterPromise;
}

/**
 * Runs local ONNX segmentation and produces a real PNG asset with a verified alpha channel.
 * The model is permissively licensed and downloaded/cached by the runtime on first use.
 */
export async function removeImageBackground(source: Buffer, mimeType: string) {
  const binary = new Uint8Array(source.byteLength);
  binary.set(source);
  const image = await RawImage.fromBlob(new Blob([binary.buffer], { type: mimeType }));
  const segmenter = await getSegmenter();
  const result = await segmenter(image);
  const maskOrCutout = Array.isArray(result) ? result[0] : result;
  if (!maskOrCutout) throw new Error("Foreground segmentation returned no mask.");

  // The background-removal pipeline currently emits an RGBA cutout. The single-channel branch
  // supports compatible pipeline versions that return only a foreground mask.
  const output =
    maskOrCutout.channels === 4
      ? maskOrCutout
      : image.rgba().putAlpha(maskOrCutout.grayscale());
  const png = Buffer.from(await output.toSharp().png().toBuffer());
  if (png.length === 0) throw new Error("Foreground segmentation produced an empty cutout.");
  return png;
}
