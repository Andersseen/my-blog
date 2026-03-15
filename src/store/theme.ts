import { atom } from "nanostores";
import { settingsService } from "../db/db";

export type Theme = "light" | "dark";

const THEME_SETTING_KEY = "theme";
const DEFAULT_THEME: Theme = "light";
const SYSTEM_DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

export const $theme = atom<Theme>(DEFAULT_THEME);

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined";

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark";

const applyThemeToDocument = (theme: Theme): void => {
  if (!isBrowser()) {
    return;
  }

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
};

const persistTheme = async (theme: Theme): Promise<void> => {
  try {
    await settingsService.set(THEME_SETTING_KEY, theme);
  } catch (error) {
    console.warn("Theme persistence failed", error);
  }
};

const readStoredTheme = async (): Promise<string | undefined> => {
  try {
    const setting = await settingsService.get(THEME_SETTING_KEY);
    return setting?.value;
  } catch (error) {
    console.warn("Theme retrieval failed", error);
    return undefined;
  }
};

export const resolveInitialTheme = (
  storedTheme: string | undefined,
  prefersDark: boolean,
): Theme => {
  if (isTheme(storedTheme)) {
    return storedTheme;
  }

  return prefersDark ? "dark" : DEFAULT_THEME;
};

export const setTheme = async (theme: Theme): Promise<void> => {
  $theme.set(theme);
  applyThemeToDocument(theme);

  if (isBrowser()) {
    await persistTheme(theme);
  }
};

export const initTheme = async (): Promise<Theme> => {
  if (!isBrowser()) {
    return $theme.get();
  }

  const storedTheme = await readStoredTheme();
  const prefersDark = window.matchMedia(SYSTEM_DARK_MODE_QUERY).matches;
  const resolvedTheme = resolveInitialTheme(storedTheme, prefersDark);

  await setTheme(resolvedTheme);
  return resolvedTheme;
};

export const toggleTheme = async (): Promise<Theme> => {
  const nextTheme: Theme = $theme.get() === "dark" ? "light" : "dark";
  await setTheme(nextTheme);
  return nextTheme;
};
