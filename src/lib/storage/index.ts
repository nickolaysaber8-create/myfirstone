import "server-only";

export type StoredObject = {
  key: string;
  contentType: string;
  bytes: number;
};

export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<StoredObject>;
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  /** Browser-facing URL. Print files are never given one. */
  publicUrl(key: string): string;
  delete(key: string): Promise<void>;
}

/**
 * Generated art and print files live behind this interface so the bucket can
 * move between providers — or stay on disk in development — without the
 * generation code knowing.
 */
let cached: Storage | null = null;

export async function storage(): Promise<Storage> {
  if (cached) return cached;

  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "s3") {
    const { createS3Storage } = await import("./s3");
    cached = createS3Storage();
  } else {
    const { createLocalStorage } = await import("./local");
    cached = createLocalStorage();
  }
  return cached;
}

/** Keys are grouped by purpose so a bucket lifecycle rule can expire drafts. */
export const keys = {
  preview: (designId: string) => `designs/${designId}/preview.webp`,
  print: (designId: string) => `designs/${designId}/print.png`,
  curatedPreview: (slug: string) => `curated/${slug}/preview.webp`,
  curatedPrint: (slug: string) => `curated/${slug}/print.png`,
  reference: (id: string, extension: string) => `references/${id}.${extension}`,
};
