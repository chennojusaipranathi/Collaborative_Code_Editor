import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { timeAgo } from "./timeAgo";

const NOW = new Date("2026-11-17T12:00:00Z");
const ago = (ms) => new Date(NOW.getTime() - ms).toISOString();

describe("timeAgo", () => {
  // A frozen clock makes the results predictable
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("says 'just now' for the last minute", () => {
    expect(timeAgo(ago(10 * 1000))).toBe("just now");
  });

  it("uses minutes, hours and days", () => {
    expect(timeAgo(ago(5 * 60 * 1000))).toBe("5 min ago");
    expect(timeAgo(ago(3 * 3600 * 1000))).toBe("3 hr ago");
    expect(timeAgo(ago(2 * 24 * 3600 * 1000))).toBe("2 days ago");
  });
});