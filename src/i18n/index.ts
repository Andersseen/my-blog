import en from "./locales/en.json";
import es from "./locales/es.json";
import ua from "./locales/ua.json";

export const LOCALES = ["es", "en", "ua"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

const dictionaries = { es, en, ua } as const;

export type Dictionary = (typeof dictionaries)[Locale];

const LOCALE_TO_LANG = {
  es: "es",
  en: "en",
  ua: "uk",
} as const;

export const isLocale = (value: string): value is Locale => {
  return LOCALES.includes(value as Locale);
};

export const getDictionary = (locale: Locale): Dictionary => {
  return dictionaries[locale];
};

export const getLocaleFromPath = (pathname: string): Locale => {
  const [firstSegment = ""] = pathname.split("/").filter(Boolean);
  return isLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE;
};

export const stripLocaleFromPath = (pathname: string): string => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "/";
  }

  const hasLocalePrefix = isLocale(segments[0]);
  const nextSegments = hasLocalePrefix ? segments.slice(1) : segments;

  if (nextSegments.length === 0) {
    return "/";
  }

  return `/${nextSegments.join("/")}`;
};

export const toLocalePath = (locale: Locale, path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const trimmedPath =
    normalizedPath === "/" ? "/" : normalizedPath.replace(/\/+$/, "");

  if (locale === DEFAULT_LOCALE) {
    return trimmedPath;
  }

  return trimmedPath === "/" ? `/${locale}` : `/${locale}${trimmedPath}`;
};

export const getLangCode = (locale: Locale): string => {
  return LOCALE_TO_LANG[locale];
};

export const getI18n = (pathname: string) => {
  const locale = getLocaleFromPath(pathname);
  return {
    locale,
    messages: getDictionary(locale),
  };
};

export const getOgLocale = (locale: Locale): string => {
  if (locale === "en") {
    return "en_US";
  }

  if (locale === "ua") {
    return "uk_UA";
  }

  return "es_ES";
};
