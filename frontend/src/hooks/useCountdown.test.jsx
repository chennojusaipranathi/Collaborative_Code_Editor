import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useCountdown from "./useCountdown";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-17T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("counts down second by second", () => {
    const serverNow = Date.now();
    const { result } = renderHook(() => useCountdown(serverNow + 60000, serverNow));
    expect(result.current).toBe(60000);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(57000);
  });

  it("uses the SERVER's clock, so a wrong computer clock changes nothing", () => {
    // This computer's clock is 10 minutes behind the server
    const serverNow = Date.now() + 10 * 60 * 1000;
    const { result } = renderHook(() => useCountdown(serverNow + 60000, serverNow));
    expect(result.current).toBe(60000);
  });

  it("reaches zero and keeps going below it", () => {
    const serverNow = Date.now();
    const { result } = renderHook(() => useCountdown(serverNow + 5000, serverNow));

    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(result.current).toBeLessThanOrEqual(0);
  });

  it("stops its timer when the page is closed", () => {
    const serverNow = Date.now();
    const { unmount } = renderHook(() => useCountdown(serverNow + 60000, serverNow));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});