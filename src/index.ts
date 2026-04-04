export interface StorageLike {
  length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface LSDBOptions {
  namespace?: string;
  storage?: StorageLike;
}

export class LSDB {
  private readonly namespace: string;
  private readonly storage: StorageLike;

  constructor(options: LSDBOptions = {}) {
    this.storage = options.storage || getDefaultStorage();
    this.namespace = options.namespace || "lsdb";
  }

  key(key: string): string {
    return `${this.namespace}:${key}`;
  }

  get<T>(key: string, fallback: T | null = null): T | null {
    const raw = this.storage.getItem(this.key(key));
    if (raw == null) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  }

  set<T>(key: string, value: T): T {
    this.storage.setItem(this.key(key), JSON.stringify(value));
    return value;
  }

  remove(key: string): boolean {
    const namespacedKey = this.key(key);
    const existing = this.storage.getItem(namespacedKey);
    this.storage.removeItem(namespacedKey);
    return existing != null;
  }

  has(key: string): boolean {
    return this.storage.getItem(this.key(key)) != null;
  }

  clear(): number {
    const prefix = `${this.namespace}:`;
    const keys: string[] = [];

    for (let index = 0; index < this.storage.length; index += 1) {
      const storageKey = this.storage.key(index);
      if (storageKey && storageKey.startsWith(prefix)) {
        keys.push(storageKey);
      }
    }

    keys.forEach((storageKey) => this.storage.removeItem(storageKey));
    return keys.length;
  }
}

function getDefaultStorage(): StorageLike {
  if (typeof globalThis.localStorage !== "undefined") {
    return globalThis.localStorage;
  }

  throw new Error(
    "No storage implementation available. Pass { storage } when running outside a browser."
  );
}
