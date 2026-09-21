import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize, resolve } from "node:path";
import type { Storage } from "./index";

const ROOT = resolve(process.cwd(), ".storage");

/** Keeps a crafted key from escaping the storage root. */
function safePath(key: string): string {
  const path = resolve(ROOT, normalize(key));
  if (path !== ROOT && !path.startsWith(ROOT + "/")) {
    throw new Error("Invalid storage key");
  }
  return path;
}

const TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

function typeFor(key: string): string {
  return TYPES[key.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}

/**
 * Development driver: writes under .storage/ and serves through an API route.
 * Same interface as the bucket, so nothing above it changes in production.
 */
export function createLocalStorage(): Storage {
  return {
    async put(key, body, contentType) {
      const path = safePath(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, body);
      await writeFile(`${path}.type`, contentType, "utf8");
      return { key, contentType, bytes: body.byteLength };
    },

    async get(key) {
      try {
        const path = safePath(key);
        const body = await readFile(path);
        let contentType = typeFor(key);
        try {
          contentType = await readFile(`${path}.type`, "utf8");
        } catch {
          // Type sidecar is optional; the extension is a fine fallback.
        }
        return { body, contentType };
      } catch {
        return null;
      }
    },

    publicUrl(key) {
      // Cache-bust on key, not on time: these objects never change in place.
      const tag = createHash("sha1").update(key).digest("hex").slice(0, 8);
      return `/api/assets/${key.split("/").map(encodeURIComponent).join("/")}?v=${tag}`;
    },

    async delete(key) {
      const path = safePath(key);
      await rm(path, { force: true });
      await rm(`${path}.type`, { force: true });
    },
  };
}

export const LOCAL_STORAGE_ROOT = ROOT;
export const localPathFor = (key: string) => join(ROOT, normalize(key));
