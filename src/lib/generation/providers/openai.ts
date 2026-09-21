import "server-only";
import { GenerationError, type ImageProvider, type ProviderRequest } from "../types";

const ENDPOINT = "https://api.openai.com/v1/images";

/**
 * The API only offers square and 3:2-ish canvases, and our tile is nearly 3:1.
 * Asking for the widest supported size and cropping the height keeps the left
 * and right edges exactly as the model drew them, which is what the seam
 * depends on — cropping the width would break it.
 */
const REQUEST_SIZE = "1536x1024";

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new GenerationError("Image generation is not configured yet.");
  return key;
}

async function parseImage(response: Response): Promise<Buffer> {
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new GenerationError("The studio is busy right now. Try again in a minute.", detail);
    }
    if (response.status === 400) {
      throw new GenerationError(
        "The studio couldn't draw that. Try describing it a different way.",
        detail,
      );
    }
    throw new GenerationError("The studio couldn't finish that design.", detail);
  }

  const body = (await response.json()) as { data?: { b64_json?: string }[] };
  const encoded = body.data?.[0]?.b64_json;
  if (!encoded) throw new GenerationError("The studio returned an empty design.");
  return Buffer.from(encoded, "base64");
}

export function createOpenAIProvider(): ImageProvider {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  return {
    name: "openai",
    model,
    supportsReference: true,

    async generate({ prompt, reference }: ProviderRequest) {
      const key = apiKey();

      // A reference photo goes through the edit endpoint as a real image
      // input, so the model sees it rather than a description of it.
      if (reference) {
        const form = new FormData();
        form.append("model", model);
        form.append("prompt", prompt);
        form.append("size", REQUEST_SIZE);
        form.append("n", "1");
        form.append(
          "image",
          new Blob([new Uint8Array(reference.data)], { type: reference.mimeType }),
          "reference",
        );

        const response = await fetch(`${ENDPOINT}/edits`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: form,
        });
        return { data: await parseImage(response), mimeType: "image/png" };
      }

      const response = await fetch(`${ENDPOINT}/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, size: REQUEST_SIZE, n: 1 }),
      });
      return { data: await parseImage(response), mimeType: "image/png" };
    },
  };
}
