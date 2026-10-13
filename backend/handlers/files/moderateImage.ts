import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";

const rekognition = new RekognitionClient({});
const s3 = new S3Client({});

const BUCKET = process.env.UPLOADS_BUCKET!;
// Minimum confidence (%) for a moderation label to count. 60 is a sensible
// default — high enough to avoid false positives, low enough to catch real
// violations.
const MIN_CONFIDENCE = Number(process.env.MODERATION_MIN_CONFIDENCE || 60);

// Top-level Rekognition moderation categories we reject. Any detected label
// whose top-level category is in this set (above MIN_CONFIDENCE) fails.
const BLOCKED_CATEGORIES = new Set([
  "Explicit Nudity",
  "Nudity",
  "Sexual Activity",
  "Graphic Violence",
  "Violence",
  "Visually Disturbing",
  "Hate Symbols",
]);

/**
 * S3 ObjectCreated handler: scans each newly uploaded image with Amazon
 * Rekognition and DELETES it if it contains nudity / explicit / violent /
 * hateful content. This runs AFTER the presigned-POST upload lands in S3.
 *
 * NOTE: this moderates the stored object. Because posts reference an imageKey,
 * a follow-up enhancement is to also flag/remove the owning post; for now the
 * image is deleted so it can never be served.
 */
export const handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const key = decodeURIComponent(
      record.s3.object.key.replace(/\+/g, " ")
    );
    try {
      const res = await rekognition.send(
        new DetectModerationLabelsCommand({
          Image: { S3Object: { Bucket: BUCKET, Name: key } },
          MinConfidence: MIN_CONFIDENCE,
        })
      );

      const labels = res.ModerationLabels ?? [];
      const violation = labels.find((l) => {
        const name = l.Name ?? "";
        const parent = l.ParentName ?? "";
        return (
          BLOCKED_CATEGORIES.has(name) || BLOCKED_CATEGORIES.has(parent)
        );
      });

      if (violation) {
        console.warn(
          `Moderation: deleting ${key} — matched "${violation.Name}" ` +
            `(${violation.Confidence?.toFixed(1)}%)`
        );
        await s3.send(
          new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
        );
      } else {
        console.log(`Moderation: ${key} passed (${labels.length} labels)`);
      }
    } catch (err) {
      // Non-image objects (or Rekognition errors) are logged, not fatal.
      console.error(`Moderation error for ${key}`, err);
    }
  }
};
