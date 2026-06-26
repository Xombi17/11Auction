import { describe, it, expect } from "vitest";
import { getIncrementForPrice } from "./auction.js";

describe("getIncrementForPrice Math & Logic", () => {
  const defaultRule = [
    { threshold: 0, increment: 5 },
    { threshold: 100, increment: 10 },
    { threshold: 500, increment: 25 }
  ];

  it("should return the base increment below any threshold", () => {
    // 0 is the lowest threshold
    expect(getIncrementForPrice(0, defaultRule)).toBe(5);
    expect(getIncrementForPrice(50, defaultRule)).toBe(5);
    expect(getIncrementForPrice(99, defaultRule)).toBe(5);
  });

  it("should return the correct increment at and above the middle threshold", () => {
    expect(getIncrementForPrice(100, defaultRule)).toBe(10);
    expect(getIncrementForPrice(250, defaultRule)).toBe(10);
    expect(getIncrementForPrice(499, defaultRule)).toBe(10);
  });

  it("should return the correct increment at and above the high threshold", () => {
    expect(getIncrementForPrice(500, defaultRule)).toBe(25);
    expect(getIncrementForPrice(1000, defaultRule)).toBe(25);
  });

  it("should fallback to default rules if rules are empty or malformed", () => {
    expect(getIncrementForPrice(100, null)).toBe(10);
    expect(getIncrementForPrice(20, null)).toBe(5);
    expect(getIncrementForPrice(100, [])).toBe(10);
    expect(getIncrementForPrice(20, [])).toBe(5);
  });

  it("should parse stringified JSON rules correctly", () => {
    const stringifiedRule = JSON.stringify([
      { threshold: 0, increment: 2 },
      { threshold: 50, increment: 8 }
    ]);
    expect(getIncrementForPrice(20, stringifiedRule)).toBe(2);
    expect(getIncrementForPrice(80, stringifiedRule)).toBe(8);
  });
});
