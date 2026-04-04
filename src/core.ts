import {
  getCollectionKey,
  getDefaultStorage,
  readCollection,
  writeCollection,
} from "./storage";
import type {
  LSDBClientOptions,
  LSDBCollection,
  LSDBEntity,
  LSDBListener,
  LSDBPredicate,
  LSDBUpdate,
  StorageLike,
} from "./types";

const DEFAULT_DELAY_MS = 500;
const DEFAULT_NAMESPACE = "default";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function defaultIdGenerator(): string {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class LSDBClient {
  private readonly namespace: string;
  private readonly storage: StorageLike;
  private readonly delayMs: number;
  private readonly idGenerator: () => string;
  private readonly listeners = new Map<string, Set<LSDBListener>>();
  private storageListenerAttached = false;

  constructor(options: LSDBClientOptions = {}) {
    this.namespace = options.namespace ?? DEFAULT_NAMESPACE;
    this.storage = options.storage ?? getDefaultStorage();
    this.delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
    this.idGenerator = options.idGenerator ?? defaultIdGenerator;
  }

  collection<T extends LSDBEntity>(name: string): LSDBCollection<T> {
    return {
      all: () => this.all<T>(name),
      find: (id: string) => this.find<T>(name, id),
      insert: (data: Omit<T, "id">) => this.insert<T>(name, data),
      update: (id: string, data: LSDBUpdate<T>) => this.update<T>(name, id, data),
      delete: (id: string) => this.delete<T>(name, id),
      query: (predicate: LSDBPredicate<T>) => this.query<T>(name, predicate),
      subscribe: (listener: LSDBListener) => this.subscribe(name, listener),
    };
  }

  async all<T extends LSDBEntity>(collectionName: string): Promise<T[]> {
    await delay(this.delayMs);
    return this.readCollection<T>(collectionName);
  }

  async find<T extends LSDBEntity>(collectionName: string, id: string): Promise<T | null> {
    await delay(this.delayMs);
    return this.readCollection<T>(collectionName).find((item) => item.id === id) ?? null;
  }

  async insert<T extends LSDBEntity>(collectionName: string, data: Omit<T, "id">): Promise<T> {
    await delay(this.delayMs);
    const items = this.readCollection<T>(collectionName);
    const newItem = { ...data, id: this.idGenerator() } as T;
    items.push(newItem);
    this.writeCollection(collectionName, items);
    return newItem;
  }

  async update<T extends LSDBEntity>(
    collectionName: string,
    id: string,
    data: LSDBUpdate<T>
  ): Promise<T> {
    await delay(this.delayMs);
    const items = this.readCollection<T>(collectionName);
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error(`Item with id "${id}" not found in collection "${collectionName}".`);
    }

    const updatedItem = { ...items[index], ...data, id } as T;
    items[index] = updatedItem;
    this.writeCollection(collectionName, items);
    return updatedItem;
  }

  async delete<T extends LSDBEntity>(collectionName: string, id: string): Promise<void> {
    await delay(this.delayMs);
    const items = this.readCollection<T>(collectionName);
    const filteredItems = items.filter((item) => item.id !== id);
    this.writeCollection(collectionName, filteredItems);
  }

  async query<T extends LSDBEntity>(
    collectionName: string,
    predicate: LSDBPredicate<T>
  ): Promise<T[]> {
    await delay(this.delayMs);
    return this.readCollection<T>(collectionName).filter(predicate);
  }

  subscribe(collectionName: string, listener: LSDBListener): () => void {
    this.ensureStorageListener();

    const collectionListeners = this.listeners.get(collectionName) ?? new Set<LSDBListener>();
    collectionListeners.add(listener);
    this.listeners.set(collectionName, collectionListeners);

    return () => {
      const nextListeners = this.listeners.get(collectionName);
      if (!nextListeners) {
        return;
      }

      nextListeners.delete(listener);
      if (nextListeners.size === 0) {
        this.listeners.delete(collectionName);
      }
    };
  }

  destroy(): void {
    if (
      this.storageListenerAttached &&
      typeof globalThis.removeEventListener === "function"
    ) {
      globalThis.removeEventListener("storage", this.handleStorageEvent);
    }

    this.listeners.clear();
    this.storageListenerAttached = false;
  }

  private readCollection<T extends LSDBEntity>(collectionName: string): T[] {
    return readCollection<T>(this.storage, this.namespace, collectionName);
  }

  private writeCollection<T extends LSDBEntity>(collectionName: string, data: T[]): void {
    writeCollection(this.storage, this.namespace, collectionName, data);
    this.notify(collectionName);
  }

  private notify(collectionName: string): void {
    const listeners = this.listeners.get(collectionName);
    if (!listeners) {
      return;
    }

    listeners.forEach((listener) => {
      listener();
    });
  }

  private ensureStorageListener(): void {
    if (this.storageListenerAttached) {
      return;
    }

    if (
      typeof globalThis.addEventListener !== "function" ||
      typeof globalThis.localStorage === "undefined" ||
      this.storage !== globalThis.localStorage
    ) {
      return;
    }

    globalThis.addEventListener("storage", this.handleStorageEvent);
    this.storageListenerAttached = true;
  }

  private handleStorageEvent = (event: StorageEvent): void => {
    if (!event.key) {
      return;
    }

    const prefix = `${getCollectionKey(this.namespace, "")}`;
    if (!event.key.startsWith(prefix)) {
      return;
    }

    const collectionName = event.key.slice(prefix.length);
    if (!collectionName) {
      return;
    }

    this.notify(collectionName);
  };
}
