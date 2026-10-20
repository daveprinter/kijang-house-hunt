import { describe, it, expect } from "vitest";
import { isPasswordValid } from "./password";

describe("password rules", () => {
  it("accepts 6 chars with upper, lower, digit, special", () => {
    expect(isPasswordValid("Ab1!cd")).toBe(true);
  });
  it("rejects fewer than 6 characters", () => {
    expect(isPasswordValid("Ab1!c")).toBe(false);
  });
  it("rejects missing uppercase", () => {
    expect(isPasswordValid("ab1!cd")).toBe(false);
  });
  it("rejects missing special character", () => {
    expect(isPasswordValid("Ab12cd")).toBe(false);
  });
  it("rejects missing digit", () => {
    expect(isPasswordValid("Ab!!cd")).toBe(false);
  });
});
