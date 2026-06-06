import { describe, expect, it } from "vitest";
import {
  resolveInitialTheme,
  setTheme,
  toggleTheme,
  type Theme,
} from "../../src/store/theme";

describe("theme resolution", () => {
  it("uses stored value when valid", () => {
    expect(resolveInitialTheme("dark", false)).toBe("dark");
    expect(resolveInitialTheme("light", true)).toBe("light");
  });

  it("falls back to system preference when no valid value exists", () => {
    expect(resolveInitialTheme(undefined, true)).toBe("dark");
    expect(resolveInitialTheme("invalid", false)).toBe("light");
  });
});

describe("theme behavior", () => {
  it("toggles between light and dark", async () => {
    await setTheme("light");
    const next = await toggleTheme();
    expect(next).toBe("dark");
  });

  it("toggles back to light from dark", async () => {
    await setTheme("dark");
    const next = await toggleTheme();
    expect(next).toBe("light");
  });
});
