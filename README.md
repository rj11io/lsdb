# `@rj11io/lsdb`

LocalStorage-backed key/value database service with bundled TypeScript declarations.

Published package contents are limited to the built `dist` directory, LICENSE, and README.

## Install

```sh
npm install @rj11io/lsdb
```

## Usage

```js
const { LSDB } = require("@rj11io/lsdb");

const db = new LSDB({ namespace: "app" });

db.set("user", { id: 1, name: "Ada" });
console.log(db.get("user"));
console.log(db.has("user"));
db.remove("user");
```

When running outside the browser, pass a storage object that implements the Web Storage API methods:
`getItem`, `setItem`, `removeItem`, `key`, and `length`.
