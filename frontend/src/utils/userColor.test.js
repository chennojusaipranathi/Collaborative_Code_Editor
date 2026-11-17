import { describe, it, expect } from "vitest";
import { colorFor } from "./userColor";

describe("colorFor", () => {
  it("returns a hex color", () => {
    expect(colorFor("6aeda52737ae8c55bb373d65")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("gives the same user the same color every time", () => {
    expect(colorFor("user-1")).toBe(colorFor("user-1"));
  });

  it("spreads different users over more than one color", () => {
    const colors = new Set(Array.from({ length: 50 }, (_, i) => colorFor(`user-${i}`)));
    expect(colors.size).toBeGreaterThan(1);
  });
});