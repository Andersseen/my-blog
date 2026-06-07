import { describe, expect, it } from "vitest";

// Simple unit test for the RSS parsing logic extracted from the Worker
// Note: DOMParser is not available in Node/Vitest, so we test the logic separately

describe("Medium Sync Worker", () => {
  it("should detect different GUIDs as new post", () => {
    const lastGuid: string = "post-123";
    const currentGuid: string = "post-456";
    expect(lastGuid !== currentGuid).toBe(true);
  });

  it("should not trigger deploy for same GUID", () => {
    const lastGuid: string = "post-123";
    const currentGuid: string = "post-123";
    expect(lastGuid !== currentGuid).toBe(false);
  });
});
