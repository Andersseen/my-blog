import Dexie, { type Table } from "dexie";

export type AppSettingKey = "theme" | "sessionToken";

export interface AppSettingRecord {
  key: AppSettingKey;
  value: string;
  updatedAt: number;
}

export interface SessionRecord {
  id: string;
  token: string;
  createdAt: number;
  expiresAt?: number;
}

class BlogDatabase extends Dexie {
  public settings!: Table<AppSettingRecord, AppSettingKey>;
  public sessions!: Table<SessionRecord, string>;

  public constructor() {
    super("my-blog-db");

    this.version(1).stores({
      settings: "key, updatedAt",
      sessions: "id, createdAt, expiresAt",
    });
  }
}

export const db = new BlogDatabase();

export const settingsService = {
  async get(key: AppSettingKey): Promise<AppSettingRecord | undefined> {
    return db.settings.get(key);
  },

  async set(key: AppSettingKey, value: string): Promise<void> {
    await db.settings.put({
      key,
      value,
      updatedAt: Date.now(),
    });
  },
};

export const sessionService = {
  async get(id: string): Promise<SessionRecord | undefined> {
    return db.sessions.get(id);
  },

  async set(record: SessionRecord): Promise<void> {
    await db.sessions.put(record);
  },

  async clear(id: string): Promise<void> {
    await db.sessions.delete(id);
  },
};
