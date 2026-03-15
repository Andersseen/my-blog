import { describe, expect, it, vi } from "vitest";
import {
  db,
  sessionService,
  settingsService,
  type SessionRecord,
} from "../../src/db/db";

describe("db service wrappers", () => {
  it("settingsService.get delegates to Dexie table", async () => {
    const expected = {
      key: "theme" as const,
      value: "dark",
      updatedAt: 123,
    };

    const getSpy = vi.spyOn(db.settings, "get").mockResolvedValue(expected);

    await expect(settingsService.get("theme")).resolves.toEqual(expected);
    expect(getSpy).toHaveBeenCalledWith("theme");
  });

  it("settingsService.set writes record with updatedAt", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(999);
    const putSpy = vi
      .spyOn(db.settings, "put")
      .mockResolvedValue("theme" as never);

    await settingsService.set("theme", "light");

    expect(nowSpy).toHaveBeenCalledOnce();
    expect(putSpy).toHaveBeenCalledWith({
      key: "theme",
      value: "light",
      updatedAt: 999,
    });
  });

  it("sessionService delegates get/set/clear", async () => {
    const record: SessionRecord = {
      id: "session-1",
      token: "token-1",
      createdAt: 100,
      expiresAt: 200,
    };

    const getSpy = vi.spyOn(db.sessions, "get").mockResolvedValue(record);
    const putSpy = vi.spyOn(db.sessions, "put").mockResolvedValue("session-1");
    const deleteSpy = vi.spyOn(db.sessions, "delete").mockResolvedValue();

    await expect(sessionService.get("session-1")).resolves.toEqual(record);
    await expect(sessionService.set(record)).resolves.toBeUndefined();
    await expect(sessionService.clear("session-1")).resolves.toBeUndefined();

    expect(getSpy).toHaveBeenCalledWith("session-1");
    expect(putSpy).toHaveBeenCalledWith(record);
    expect(deleteSpy).toHaveBeenCalledWith("session-1");
  });
});
