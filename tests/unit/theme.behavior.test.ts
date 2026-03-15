import { beforeEach, describe, expect, it, vi } from "vitest";
import { settingsService } from "../../src/db/db";
import {
  $theme,
  initTheme,
  setTheme,
  toggleTheme,
} from "../../src/store/theme";

describe("theme behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "";
    $theme.set("light");
  });

  it("setTheme updates store, DOM and persistence", async () => {
    const setSpy = vi
      .spyOn(settingsService, "set")
      .mockResolvedValue(undefined);

    await setTheme("dark");

    expect($theme.get()).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(setSpy).toHaveBeenCalledWith("theme", "dark");
  });

  it("setTheme handles persistence errors gracefully", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.spyOn(settingsService, "set").mockRejectedValue(new Error("db down"));

    await expect(setTheme("dark")).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("initTheme prefers stored value", async () => {
    vi.spyOn(settingsService, "get").mockResolvedValue({
      key: "theme",
      value: "dark",
      updatedAt: Date.now(),
    });

    const result = await initTheme();

    expect(result).toBe("dark");
    expect($theme.get()).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("initTheme falls back to system preference when storage fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.spyOn(settingsService, "get").mockRejectedValue(new Error("db down"));
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    const result = await initTheme();

    expect(result).toBe("dark");
    expect($theme.get()).toBe("dark");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("toggleTheme flips between dark and light", async () => {
    vi.spyOn(settingsService, "set").mockResolvedValue(undefined);

    await setTheme("light");
    const next = await toggleTheme();

    expect(next).toBe("dark");
    expect($theme.get()).toBe("dark");
  });
});
