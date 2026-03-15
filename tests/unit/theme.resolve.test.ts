import { describe, expect, it } from "vitest";
import { resolveInitialTheme } from "../../src/store/theme";

describe("resolveInitialTheme", () => {
  it("uses stored value when valid", () => {
    expect(resolveInitialTheme("dark", false)).toBe("dark");
    expect(resolveInitialTheme("light", true)).toBe("light");
  });

  it("falls back to system preference when no valid value exists", () => {
    expect(resolveInitialTheme(undefined, true)).toBe("dark");
    expect(resolveInitialTheme("invalid", false)).toBe("light");
  });
});
