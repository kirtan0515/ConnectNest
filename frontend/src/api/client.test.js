import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// getIdToken is called on every request; stub it so tests don't touch Cognito.
vi.mock("../auth/auth", () => ({ getIdToken: vi.fn(async () => "test-token") }));

import { api } from "./client";
import { getIdToken } from "../auth/auth";

function mockFetch(status, body) {
  return vi.fn(async () => ({
    status,
    ok: status >= 200 && status < 300,
    text: async () => (body == null ? "" : JSON.stringify(body)),
  }));
}

describe("api client", () => {
  beforeEach(() => {
    getIdToken.mockResolvedValue("test-token");
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("parses a JSON 200 response", async () => {
    global.fetch = mockFetch(200, { items: [1, 2, 3] });
    const data = await api.get("/things");
    expect(data).toEqual({ items: [1, 2, 3] });
  });

  it("returns null for 204 No Content", async () => {
    global.fetch = mockFetch(204, null);
    const data = await api.del("/things/1");
    expect(data).toBeNull();
  });

  it("attaches the bearer token when signed in", async () => {
    const f = mockFetch(200, {});
    global.fetch = f;
    await api.get("/me");
    const [, options] = f.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer test-token");
  });

  it("still sends the request when there is no session", async () => {
    getIdToken.mockRejectedValueOnce(new Error("no session"));
    const f = mockFetch(200, {});
    global.fetch = f;
    await api.get("/public");
    const [, options] = f.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("throws an error carrying the status and server message on failure", async () => {
    global.fetch = mockFetch(403, { message: "Forbidden" });
    await expect(api.post("/things", {})).rejects.toMatchObject({
      message: "Forbidden",
      status: 403,
    });
  });
});
