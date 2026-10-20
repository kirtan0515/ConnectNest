import { ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { ddb } from "./db.js";

const ENDPOINT = process.env.WS_MANAGEMENT_ENDPOINT;
const TABLE = process.env.CONNECTIONS_TABLE;

const mgmt = ENDPOINT
  ? new ApiGatewayManagementApiClient({ endpoint: ENDPOINT })
  : null;

/**
 * Best-effort fan-out of a message to every open WebSocket connection.
 * No-ops when the realtime infra is not wired (missing env). NEVER throws —
 * create flows call this after their write and must not fail because of it.
 */
export async function broadcast(payload: {
  type: string;
  item: unknown;
}): Promise<void> {
  if (!mgmt || !TABLE) return;

  const data = Buffer.from(JSON.stringify(payload));

  try {
    let lastKey: Record<string, unknown> | undefined;
    do {
      const page = await ddb.send(
        new ScanCommand({
          TableName: TABLE,
          ExclusiveStartKey: lastKey,
        })
      );

      const rows = page.Items ?? [];
      await Promise.allSettled(
        rows.map(async (row) => {
          const connectionId = row.connectionId as string;
          try {
            await mgmt.send(
              new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: data,
              })
            );
          } catch (err) {
            if ((err as { $metadata?: { httpStatusCode?: number } })?.$metadata
              ?.httpStatusCode === 410) {
              // Stale connection — drop it.
              await ddb.send(
                new DeleteCommand({
                  TableName: TABLE,
                  Key: { connectionId },
                })
              );
            } else {
              console.error("broadcast post error", connectionId, err);
            }
          }
        })
      );

      lastKey = page.LastEvaluatedKey;
    } while (lastKey);
  } catch (err) {
    // Swallow: broadcast must never break the originating write.
    console.error("broadcast scan error", err);
  }
}
