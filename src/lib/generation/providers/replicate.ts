import "server-only";
import { GenerationError, type ImageProvider, type ProviderRequest } from "../types";

const ENDPOINT = "https://api.replicate.com/v1/predictions";
const POLL_INTERVAL_MS = 1200;
const TIMEOUT_MS = 90_000;

type Prediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string[] | string;
  error?: string;
};

function token(): string {
  const value = process.env.REPLICATE_API_TOKEN;
  if (!value) throw new GenerationError("Image generation is not configured yet.");
  return value;
}

/**
 * Second adapter, so the provider choice is a real seam rather than a promise
 * of one. Model-specific input names differ, so the model is named in the
 * environment and the common fields are sent.
 */
export function createReplicateProvider(): ImageProvider {
  const model = process.env.REPLICATE_IMAGE_MODEL;

  return {
    name: "replicate",
    model: model ?? "unset",
    supportsReference: true,

    async generate({ prompt, width, height, reference, seed }: ProviderRequest) {
      if (!model) throw new GenerationError("Image generation is not configured yet.");
      const key = token();

      const input: Record<string, unknown> = {
        prompt,
        width,
        height,
        num_outputs: 1,
        output_format: "png",
      };
      if (seed !== undefined) input.seed = seed;
      if (reference) {
        input.image = `data:${reference.mimeType};base64,${reference.data.toString("base64")}`;
      }

      const created = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ version: model, input }),
      });

      if (!created.ok) {
        const detail = await created.text().catch(() => "");
        throw new GenerationError("The studio couldn't start that design.", detail);
      }

      let prediction = (await created.json()) as Prediction;
      const deadline = Date.now() + TIMEOUT_MS;

      while (prediction.status === "starting" || prediction.status === "processing") {
        if (Date.now() > deadline) {
          throw new GenerationError("That design took too long. Try again.");
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        const polled = await fetch(`${ENDPOINT}/${prediction.id}`, {
          headers: { Authorization: `Bearer ${key}` },
        });
        prediction = (await polled.json()) as Prediction;
      }

      if (prediction.status !== "succeeded") {
        throw new GenerationError("The studio couldn't finish that design.", prediction.error);
      }

      const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      if (!url) throw new GenerationError("The studio returned an empty design.");

      const image = await fetch(url);
      if (!image.ok) throw new GenerationError("The studio couldn't collect that design.");

      return {
        data: Buffer.from(await image.arrayBuffer()),
        mimeType: image.headers.get("content-type") ?? "image/png",
        seed: seed?.toString(),
      };
    },
  };
}
