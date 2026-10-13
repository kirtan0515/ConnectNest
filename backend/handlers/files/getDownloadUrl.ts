import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  ok,
  badRequest,
  serverError,
  getUserId,
  type ApiEvent,
} from "../../shared/http.js";

const BUCKET = process.env.UPLOADS_BUCKET!;
const s3 = new S3Client({});

// Only allow keys shaped exactly like what the upload flow produces:
// <scope>/<userId>/<file>. This blocks path traversal (../), absolute keys,
// and arbitrary bucket paths — a valid JWT alone must not grant free reign.
const KEY_RE = /^(avatars|posts|files)\/[^/]+\/[^/]+$/;

/**
 * GET /uploads/url?key=<objectKey> — returns a short-lived presigned GET URL
 * for an object in the uploads bucket. Requires a valid Cognito JWT.
 */
export const handler = async (event: ApiEvent) => {
  try {
    getUserId(event); // require auth; identity derived from the token

    const key = event.queryStringParameters?.key;
    if (!key) return badRequest("key is required");
    if (!KEY_RE.test(key)) return badRequest("invalid key");

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 300 }
    );

    return ok({ url });
  } catch (err) {
    console.error("getDownloadUrl error", err);
    return serverError();
  }
};
