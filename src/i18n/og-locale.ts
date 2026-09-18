import type { Locale } from '@etyma/core';

/**
 * Open Graph's underscore-style locale metadata is a distinct concept from Etyma's
 * BCP-47 language codes — Etyma intentionally does not own this mapping.
 */
const OG_LOCALES: Record<string, string> = {
  es: 'es_ES',
  en: 'en_US',
  uk: 'uk_UA',
};

export const getOgLocale = (locale: Locale): string => OG_LOCALES[locale] ?? 'en_US';
