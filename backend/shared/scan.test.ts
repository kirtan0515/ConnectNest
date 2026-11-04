import { describe, it, expect, vi, beforeEach } from "vitest";

// Replace the DynamoDB client so scanAll can be tested without AWS.
const send = vi.fn();
vi.mock("./db.js", () => ({ ddb: { send: (cmd: unknown) => send(cmd) } }));

import { scanAll } from "./scan.js";

describe("scanAll", () => {
  beforeEach(() => send.mockReset());

  it("follows LastEvaluatedKey across pages and concatenates items", async () => {
    send
      .mockResolvedValueOnce({ Items: [{ id: 1 }, { id: 2 }], LastEvaluatedKey: { id: 2 } })
      .mockResolvedValueOnce({ Items: [{ id: 3 }], LastEvaluatedKey: { id: 3 } })
      .mockResolvedValueOnce({ Items: [{ id: 4 }] });
    const items = await scanAll({ TableName: "T" });
    expect(items.map((i) => i.id)).toEqual([1, 2, 3, 4]);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("passes the previous key as ExclusiveStartKey", async () => {
    send
      .mockResolvedValueOnce({ Items: [], LastEvaluatedKey: { id: "k" } })
      .mockResolvedValueOnce({ Items: [] });
    await scanAll({ TableName: "T" });
    expect(send.mock.calls[1][0].input.ExclusiveStartKey).toEqual({ id: "k" });
  });

  it("stops at maxPages even if DynamoDB keeps returning a key", async () => {
    send.mockResolvedValue({ Items: [{ x: 1 }], LastEvaluatedKey: { x: 1 } });
    const items = await scanAll({ TableName: "T" }, 3);
    expect(send).toHaveBeenCalledTimes(3);
    expect(items).toHaveLength(3);
  });

  it("handles an empty table", async () => {
    send.mockResolvedValueOnce({});
    expect(await scanAll({ TableName: "T" })).toEqual([]);
  });
});
