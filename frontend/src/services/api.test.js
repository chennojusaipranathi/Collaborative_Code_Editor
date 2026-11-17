import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { request } from "./api";

// A fake response like the one fetch returns. body === undefined means "not JSON".
const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => (body === undefined ? Promise.reject(new Error("not json")) : Promise.resolve(body)),
});

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("request", () => {
  it("returns the parsed JSON, and sends a plain GET", async () => {
    fetchMock.mockResolvedValue(reply(200, { status: "ok" }));

    const data = await request("/api/health");
    expect(data).toEqual({ status: "ok" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/health$/);
    expect(options.method).toBe("GET");
    expect(options.headers).toEqual({});
    expect(options.body).toBeUndefined();
  });

  it("sends the JSON body and the login token", async () => {
    fetchMock.mockResolvedValue(reply(201, { ok: true }));

    await request("/api/rooms", { method: "POST", body: { name: "Lab" }, token: "abc" });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers.Authorization).toBe("Bearer abc");
    expect(options.body).toBe(JSON.stringify({ name: "Lab" }));
  });

  it("turns a server error into an Error with the server's message and status", async () => {
    fetchMock.mockResolvedValue(reply(401, { message: "Invalid email or password" }));

    await expect(request("/api/auth/login")).rejects.toMatchObject({
      message: "Invalid email or password",
      status: 401,
    });
  });

  it("still gives a useful message when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(reply(500));

    await expect(request("/api/rooms")).rejects.toMatchObject({
      message: "Request failed (500)",
      status: 500,
    });
  });

  it("explains when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(request("/api/rooms")).rejects.toThrow("Cannot reach the server. Is the backend running?");
  });
});