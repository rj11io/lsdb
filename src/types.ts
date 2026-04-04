export interface StorageLike {
  length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface LSDBEntity {
  id: string;
  [key: string]: unknown;
}

export type LSDBPredicate<T extends LSDBEntity> = (item: T) => boolean;
export type LSDBListener = () => void;
export type LSDBUpdate<T extends LSDBEntity> = Partial<Omit<T, "id">>;

export interface LSDBCollection<T extends LSDBEntity> {
  all(): Promise<T[]>;
  find(id: string): Promise<T | null>;
  insert(data: Omit<T, "id">): Promise<T>;
  update(id: string, data: LSDBUpdate<T>): Promise<T>;
  delete(id: string): Promise<void>;
  query(predicate: LSDBPredicate<T>): Promise<T[]>;
  subscribe(listener: LSDBListener): () => void;
}

export interface LSDBClientOptions {
  namespace?: string;
  storage?: StorageLike;
  delayMs?: number;
  idGenerator?: () => string;
}
