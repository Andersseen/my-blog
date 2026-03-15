import { defineCustomElements } from "@andersseen/web-components/loader";
import {
  COMPONENT_ICONS,
  COMPASS,
  EXTERNAL_LINK,
  MOON,
  SUN,
  registerIcons,
} from "@andersseen/icon";

declare global {
  interface Window {
    __andersseenReady?: boolean;
  }
}

const setupAndersseen = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.__andersseenReady) {
    return;
  }

  defineCustomElements(window);
  registerIcons({
    ...COMPONENT_ICONS,
    compass: COMPASS,
    "external-link": EXTERNAL_LINK,
    moon: MOON,
    sun: SUN,
  });

  window.__andersseenReady = true;
};

setupAndersseen();
