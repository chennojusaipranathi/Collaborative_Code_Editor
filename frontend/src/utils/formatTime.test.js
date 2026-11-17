import { describe, it, expect } from "vitest";
import { formatTime } from "./formatTime";

describe("formatTime", () => {
  it("formats milliseconds as MM:SS", () => {
    expect(formatTime(125000)).toBe("02:05");
    expect(formatTime(60000)).toBe("01:00");
    expect(formatTime(9000)).toBe("00:09");
  });

  it("never goes below zero", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(-5000)).toBe("00:00");
  });

  it("rounds partial seconds down", () => {
    expect(formatTime(1999)).toBe("00:01");
  });

  it("keeps counting minutes past an hour", () => {
    expect(formatTime(3600000)).toBe("60:00");
  });
});