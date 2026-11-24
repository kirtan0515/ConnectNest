import type { SESEvent } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { isUnsafe, rewriteForForwarding } from "../../shared/inboundMail";

/**
 * Forwards mail that SES receiving stored in S3 to the owner's inbox.
 * Triggered by the SES receipt rule after its S3 action. Spam/virus FAIL
 * messages stay in S3 (until lifecycle expiry) and are not forwarded.
 */
const s3 = new S3Client({});
const ses = new SESv2Client({});

export const handler = async (event: SESEvent): Promise<void> => {
  const bucket = process.env.BUCKET_NAME!;
  const prefix = process.env.KEY_PREFIX ?? "";
  const fromAddress = process.env.FROM_ADDRESS!;
  const forwardTo = process.env.FORWARD_TO!;

  for (const record of event.Records) {
    const { mail, receipt } = record.ses;
    if (isUnsafe(receipt)) {
      console.warn("Not forwarding flagged message", {
        messageId: mail.messageId,
        spam: receipt.spamVerdict?.status,
        virus: receipt.virusVerdict?.status,
      });
      continue;
    }
    const object = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: `${prefix}${mail.messageId}` }),
    );
    const original = await object.Body!.transformToString("latin1");
    const { raw } = rewriteForForwarding(
      original,
      receipt.recipients[0] ?? "",
      { fromAddress, forwardTo },
    );
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: fromAddress,
        Destination: { ToAddresses: [forwardTo] },
        Content: { Raw: { Data: Buffer.from(raw, "latin1") } },
      }),
    );
    console.info("Forwarded message", { messageId: mail.messageId });
  }
};
