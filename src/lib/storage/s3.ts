import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Storage } from "./index";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set but STORAGE_DRIVER is "s3"`);
  return value;
}

/**
 * Any S3-compatible bucket — R2, Backblaze, MinIO, S3 itself. Credentials are
 * read here and nowhere else, and never cross into a client component.
 */
export function createS3Storage(): Storage {
  const bucket = required("S3_BUCKET");
  const endpoint = process.env.S3_ENDPOINT || undefined;

  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint,
    // Non-AWS providers serve buckets on a path, not a subdomain.
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: required("S3_ACCESS_KEY_ID"),
      secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
    },
  });

  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/+$/, "");

  return {
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          // Objects are content-addressed by design id, so they never change.
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return { key, contentType, bytes: body.byteLength };
    },

    async get(key) {
      try {
        const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (!result.Body) return null;
        const body = Buffer.from(await result.Body.transformToByteArray());
        return { body, contentType: result.ContentType ?? "application/octet-stream" };
      } catch {
        return null;
      }
    },

    publicUrl(key) {
      // Without a CDN in front, go back through the app so the bucket itself
      // can stay private.
      if (!publicBase) return `/api/assets/${key.split("/").map(encodeURIComponent).join("/")}`;
      return `${publicBase}/${key}`;
    },

    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
