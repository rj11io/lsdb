import type { LSDBEntity, StorageLike } from "./types";

export const STORAGE_PREFIX = "lsdb";

export class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

export function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) {
    return fallback;
  }

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("LSDB parse error:", error);
    return fallback;
  }
}

export function getCollectionKey(namespace: string, collectionName: string): string {
  return `${STORAGE_PREFIX}:${namespace}:${collectionName}`;
}

export function getDefaultStorage(): StorageLike {
  if (typeof globalThis.localStorage !== "undefined") {
    return globalThis.localStorage;
  }

  throw new Error(
    "No storage implementation available. Pass { storage } when running outside a browser."
  );
}

function isEntity(value: unknown): value is LSDBEntity {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string"
  );
}

export function readCollection<T extends LSDBEntity>(
  storage: StorageLike,
  namespace: string,
  collectionName: string
): T[] {
  const key = getCollectionKey(namespace, collectionName);
  const parsed = safeParse<unknown>(storage.getItem(key), []);

  if (!Array.isArray(parsed)) {
    console.warn(`LSDB collection "${key}" was not an array. Resetting to an empty collection.`);
    return [];
  }

  const validItems = parsed.filter(isEntity) as T[];
  if (validItems.length !== parsed.length) {
    console.warn(`LSDB collection "${key}" contained invalid records. Dropping invalid entries.`);
  }

  return validItems;
}

export function writeCollection<T extends LSDBEntity>(
  storage: StorageLike,
  namespace: string,
  collectionName: string,
  data: T[]
): void {
  const key = getCollectionKey(namespace, collectionName);

  try {
    storage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`LSDB write error for "${key}":`, error);
    throw error;
  }
}
