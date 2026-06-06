import { describe, expect, it } from "vitest";
import {
  getLocaleFromPath,
  stripLocaleFromPath,
  toLocalePath,
  getLangCode,
  getOgLocale,
  isLocale,
} from "../../src/i18n";

describe("getLocaleFromPath", () => {
  it("extracts locale from path", () => {
    expect(getLocaleFromPath("/en/blog")).toBe("en");
    expect(getLocaleFromPath("/ua/post")).toBe("ua");
  });

  it("defaults to es when no locale prefix", () => {
    expect(getLocaleFromPath("/blog")).toBe("es");
    expect(getLocaleFromPath("/")).toBe("es");
  });
});

describe("stripLocaleFromPath", () => {
  it("removes locale prefix from path", () => {
    expect(stripLocaleFromPath("/en/blog")).toBe("/blog");
    expect(stripLocaleFromPath("/ua/about")).toBe("/about");
  });

  it("returns root for root path", () => {
    expect(stripLocaleFromPath("/")).toBe("/");
    expect(stripLocaleFromPath("/es")).toBe("/");
  });
});

describe("toLocalePath", () => {
  it("returns path without locale for default", () => {
    expect(toLocalePath("es", "/blog")).toBe("/blog");
    expect(toLocalePath("es", "/")).toBe("/");
  });

  it("prefixes non-default locales", () => {
    expect(toLocalePath("en", "/blog")).toBe("/en/blog");
    expect(toLocalePath("ua", "/")).toBe("/ua");
  });
});

describe("getLangCode", () => {
  it("maps locales to HTML lang codes", () => {
    expect(getLangCode("es")).toBe("es");
    expect(getLangCode("en")).toBe("en");
    expect(getLangCode("ua")).toBe("uk");
  });
});

describe("getOgLocale", () => {
  it("returns correct OG locale", () => {
    expect(getOgLocale("en")).toBe("en_US");
    expect(getOgLocale("ua")).toBe("uk_UA");
    expect(getOgLocale("es")).toBe("es_ES");
  });
});

describe("isLocale", () => {
  it("returns true for valid locales", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ua")).toBe(true);
  });

  it("returns false for invalid locales", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("de")).toBe(false);
  });
});
