const test = require("node:test");
const assert = require("node:assert/strict");
const { LSDBClient, MemoryStorage, getCollectionKey } = require("../dist/index.js");

function createClient(namespace) {
  return new LSDBClient({
    namespace,
    delayMs: 0,
    storage: new MemoryStorage(),
  });
}

test("supports CRUD and query operations", async () => {
  const client = createClient("crud");
  const todos = client.collection("todos");

  const first = await todos.insert({ title: "first", done: false });
  const second = await todos.insert({ title: "second", done: true });

  assert.equal((await todos.find(first.id)).title, "first");
  assert.equal((await todos.query((item) => item.done)).length, 1);

  const updated = await todos.update(first.id, { done: true, id: "ignored" });
  assert.equal(updated.id, first.id);

  await todos.delete(second.id);
  assert.deepEqual(await todos.all(), [
    {
      id: first.id,
      title: "first",
      done: true,
    },
  ]);
});

test("recovers from malformed stored collections", async () => {
  const storage = new MemoryStorage();
  storage.setItem(getCollectionKey("invalid", "todos"), JSON.stringify({ broken: true }));

  const client = new LSDBClient({
    namespace: "invalid",
    delayMs: 0,
    storage,
  });

  const todos = client.collection("todos");
  assert.deepEqual(await todos.all(), []);

  const created = await todos.insert({ title: "safe", done: false });
  assert.equal(created.title, "safe");
  assert.equal((await todos.all()).length, 1);
});

test("notifies subscribers for local writes", async () => {
  const client = createClient("subscribe");
  const todos = client.collection("todos");
  let notifications = 0;

  const unsubscribe = todos.subscribe(() => {
    notifications += 1;
  });

  await todos.insert({ title: "new", done: false });
  await todos.update((await todos.all())[0].id, { done: true });
  await todos.delete((await todos.all())[0].id);

  unsubscribe();

  assert.equal(notifications, 3);
});
