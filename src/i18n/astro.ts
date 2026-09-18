import { createAstroI18n, type AstroI18n, type AstroI18nContext } from '@etyma/astro';
import { i18n } from './index';

export type { MessageKey } from './index';
export type BlogI18n = AstroI18n<import('./index').MessageKey>;
export type Translate = BlogI18n['t'];
export type LocalePath = BlogI18n['path'];

/** Creates the request-scoped Etyma instance for the current Astro render. */
export const getPageI18n = (astro: AstroI18nContext) => createAstroI18n(astro, i18n);
