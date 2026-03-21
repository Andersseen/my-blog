import "@andersseen/web-components/components/and-icon.js";
import "@andersseen/web-components/components/and-dropdown.js";
import "@andersseen/web-components/components/and-navbar.js";
import "@andersseen/web-components/components/and-drawer.js";
import "@andersseen/web-components/components/and-button.js";
import "@andersseen/web-components/components/and-card.js";
import "@andersseen/web-components/components/and-badge.js";
import "@andersseen/web-components/components/and-breadcrumb.js";
import "@andersseen/web-components/components/and-breadcrumb-item.js";
import { enableAnimations } from "@andersseen/web-components";
import {
  COMPONENT_ICONS,
  CLOSE,
  COMPASS,
  EXTERNAL_LINK,
  MENU,
  MOON,
  SUN,
  registerIcons,
} from "@andersseen/icon";

declare global {
  interface Window {
    __andersseenReady?: boolean;
    __AND_ANIMATED__?: boolean;
  }
}

const PROJECT_ICONS: Record<string, string> = {
  close: CLOSE,
  compass: COMPASS,
  "external-link": EXTERNAL_LINK,
  menu: MENU,
  moon: MOON,
  sun: SUN,
};

const ICON_REGISTRY: Record<string, string> = {
  ...COMPONENT_ICONS,
  ...PROJECT_ICONS,
};

const assertRegisteredIcons = (): void => {
  if (!import.meta.env.DEV || typeof document === "undefined") {
    return;
  }

  const missing = new Set<string>();

  document
    .querySelectorAll<HTMLElement>("and-icon[name]")
    .forEach((iconElement) => {
      const iconName = iconElement.getAttribute("name");

      if (iconName && !(iconName in ICON_REGISTRY)) {
        missing.add(iconName);
      }
    });

  missing.forEach((iconName) => {
    console.warn(
      `[andersseen] Missing icon registration for \"${iconName}\" in src/scripts/setup-andersseen.ts.`,
    );
  });
};

const setupAndersseen = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.__andersseenReady) {
    return;
  }

  // Keep API-level animation enabling for Andersseen components.
  enableAnimations();

  registerIcons(ICON_REGISTRY);

  window.__andersseenReady = true;

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      assertRegisteredIcons();
    });
    return;
  }

  setTimeout(() => {
    assertRegisteredIcons();
  }, 0);
};

setupAndersseen();
