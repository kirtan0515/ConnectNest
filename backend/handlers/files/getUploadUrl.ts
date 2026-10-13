import { randomUUID } from "node:crypto";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import {
  ok,
  badRequest,
  serverError,
  getUserId,
  parseBody,
  type ApiEvent,
} from "../../shared/http.js";

const BUCKET = process.env.UPLOADS_BUCKET!;
const s3 = new S3Client({});

// Security: only allow safe image types. Prevents an attacker from uploading
// an HTML/JS/SVG payload (Stored XSS) or an executable disguised as an image.
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB cap — prevents "denial of wallet"

interface PresignInput {
  fileName?: string;
  contentType?: string;
  scope?: string; // "avatars" | "posts" | "files"
}

/**
 * POST /uploads/presign — returns a presigned POST policy for a browser upload.
 *
 * Security controls (all enforced in the SIGNED policy, so the client cannot
 * bypass them):
 *  - Content-Type must be an allow-listed image type.
 *  - Content-Length is bounded (content-length-range) -> no multi-GB uploads.
 *  - Object key is namespaced by the JWT userId -> users can't overwrite others.
 *  - URL expires in 5 minutes.
 */
export const handler = async (event: ApiEvent) => {
  try {
    const userId = getUserId(event);
    const body = parseBody<PresignInput>(event);

    if (!body.fileName) return badRequest("fileName is required");

    const contentType = body.contentType ?? "";
    const ext = ALLOWED_TYPES[contentType];
    if (!ext) {
      return badRequest(
        "Unsupported file type. Allowed: PNG, JPEG, WebP, GIF."
      );
    }

    const scope = (body.scope ?? "files").replace(/[^a-zA-Z0-9_-]/g, "");
    // Ignore the client extension entirely; derive it from the verified type.
    const key = `${scope}/${userId}/${randomUUID()}.${ext}`;

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: BUCKET,
      Key: key,
      Conditions: [
        ["content-length-range", 1, MAX_BYTES],
        ["eq", "$Content-Type", contentType],
      ],
      Fields: { "Content-Type": contentType },
      Expires: 300,
    });

    // Client POSTs multipart/form-data: all `fields` + the file, to `url`.
    return ok({ url, fields, key, maxBytes: MAX_BYTES });
  } catch (err) {
    console.error("getUploadUrl error", err);
    return serverError();
  }
};
