"use strict";

class LSDB {
  constructor(options = {}) {
    this.storage = options.storage || getDefaultStorage();
    this.namespace = options.namespace || "lsdb";
  }

  key(key) {
    return `${this.namespace}:${key}`;
  }

  get(key, fallback = null) {
    const raw = this.storage.getItem(this.key(key));
    if (raw == null) {
      return fallback;
    }

    return JSON.parse(raw);
  }

  set(key, value) {
    this.storage.setItem(this.key(key), JSON.stringify(value));
    return value;
  }

  remove(key) {
    const namespacedKey = this.key(key);
    const existing = this.storage.getItem(namespacedKey);
    this.storage.removeItem(namespacedKey);
    return existing != null;
  }

  has(key) {
    return this.storage.getItem(this.key(key)) != null;
  }

  clear() {
    const prefix = `${this.namespace}:`;
    const keys = [];

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

function getDefaultStorage() {
  if (globalThis.localStorage) {
    return globalThis.localStorage;
  }

  throw new Error(
    "No storage implementation available. Pass { storage } when running outside a browser."
  );
}

module.exports = {
  LSDB,
};
