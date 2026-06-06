import { describe, expect, it } from "vitest";
import {
  generatePostGroups,
  getLayoutClasses,
  getPostClasses,
  isFeatured,
  getTitleSize,
  shouldShowDescription,
} from "../../src/lib/bento-layout";
import type { UnifiedPost } from "../../src/types/blog";

function createMockPosts(count: number): UnifiedPost[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i}`,
    data: {
      title: `Post ${i}`,
      description: `Description ${i}`,
      pubDate: new Date(2024, 0, i + 1),
      isExternal: false,
    },
  }));
}

describe("generatePostGroups", () => {
  it("handles empty array", () => {
    expect(generatePostGroups([])).toEqual([]);
  });

  it("first group is always featured", () => {
    const posts = createMockPosts(6);
    const groups = generatePostGroups(posts);
    expect(groups[0].isFirst).toBe(true);
    expect(["FEATURED_LEFT", "FEATURED_RIGHT"]).toContain(groups[0].layout);
  });

  it("does not repeat layouts consecutively", () => {
    const posts = createMockPosts(20);
    const groups = generatePostGroups(posts);
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i].layout).not.toBe(groups[i - 1].layout);
    }
  });

  it("uses all posts", () => {
    const posts = createMockPosts(13);
    const groups = generatePostGroups(posts);
    const usedPosts = groups.reduce((sum, g) => sum + g.posts.length, 0);
    expect(usedPosts).toBe(13);
  });
});

describe("getLayoutClasses", () => {
  it("returns grid classes for all layouts", () => {
    const layouts = ['FEATURED_LEFT', 'DUAL', 'TRIPLE', 'QUAD', 'GRID_6', 'SINGLE'] as const;
    layouts.forEach((layout) => {
      const classes = getLayoutClasses(layout);
      expect(classes).toContain("grid");
      expect(classes).toContain("md:grid-cols-12");
    });
  });
});

describe("getPostClasses", () => {
  it("featured left first item spans 8 cols", () => {
    expect(getPostClasses('FEATURED_LEFT', 0, 5)).toContain('md:col-span-8');
  });

  it("dual layout splits 6 cols each", () => {
    expect(getPostClasses('DUAL', 0, 2)).toContain('md:col-span-6');
    expect(getPostClasses('DUAL', 1, 2)).toContain('md:col-span-6');
  });
});

describe("isFeatured", () => {
  it("first two posts in featured layouts are featured", () => {
    expect(isFeatured('FEATURED_LEFT', 0)).toBe(true);
    expect(isFeatured('FEATURED_LEFT', 1)).toBe(true);
    expect(isFeatured('FEATURED_LEFT', 2)).toBe(false);
  });

  it("single layout is always featured", () => {
    expect(isFeatured('SINGLE', 0)).toBe(true);
  });
});

describe("getTitleSize", () => {
  it("featured first post has largest title", () => {
    expect(getTitleSize('FEATURED_LEFT', 0)).toContain('text-3xl');
  });

  it("non-featured posts have smaller titles", () => {
    expect(getTitleSize('TRIPLE', 2)).toBe('text-lg');
  });
});

describe("shouldShowDescription", () => {
  it("only shows description for featured posts", () => {
    expect(shouldShowDescription('FEATURED_LEFT', 0)).toBe(true);
    expect(shouldShowDescription('TRIPLE', 2)).toBe(false);
  });
});
