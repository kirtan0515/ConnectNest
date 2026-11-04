import { ScanCommand, type ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { ddb } from "./db.js";

/**
 * Scan a whole table, following LastEvaluatedKey.
 *
 * A single DynamoDB Scan returns at most 1 MB and then stops, so a bare
 * `ddb.send(new ScanCommand(...))` silently drops everything past the first page
 * as a table grows. Use this for the "list everything" endpoints that still scan.
 * `maxPages` is a safety valve against runaway reads.
 */
export async function scanAll(
  input: ScanCommandInput,
  maxPages = 20
): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;
  let pages = 0;
  do {
    const res = await ddb.send(
      new ScanCommand({ ...input, ExclusiveStartKey: lastKey })
    );
    items.push(...((res.Items ?? []) as Record<string, unknown>[]));
    lastKey = res.LastEvaluatedKey;
    pages += 1;
  } while (lastKey && pages < maxPages);
  return items;
}
