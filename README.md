# `@rj11io/lsdb`

Async localStorage-backed collection store for browser apps.

Published package contents are limited to the built `dist` directory, LICENSE, and README.

## Install

```sh
npm install @rj11io/lsdb
```

## Core Usage

```ts
import { LSDBClient } from "@rj11io/lsdb";

type Todo = {
  id: string;
  title: string;
  done: boolean;
};

const client = new LSDBClient({
  namespace: "app",
});

const todos = client.collection<Todo>("todos");

const created = await todos.insert({
  title: "Review LSDB package",
  done: false,
});

await todos.update(created.id, { done: true });
const allTodos = await todos.all();
```

## API

- `new LSDBClient(options)`: creates a client for one namespace.
- `collection(name)`: gets a collection facade with `all`, `find`, `insert`, `update`, `delete`, `query`, and `subscribe`.
- `MemoryStorage`: in-memory storage driver for tests or non-browser environments.
- React bindings live in the companion package `@rj11io/lsdb-react`.

## Notes

- Data is stored per collection under keys shaped like `lsdb:<namespace>:<collection>`.
- Collections recover from malformed stored JSON by falling back to an empty array.
- `update()` preserves the original record `id` even if the patch includes its own `id`.
- `subscribe()` fires for local writes and for `storage` events from other tabs when using `window.localStorage`.
