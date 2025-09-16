import { openDB } from "idb";

const DB_NAME = "intro_conclude_db";
const DB_VERSION = 1;

export const initializeDBIntroConclude = async (collection: string) => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(collection)) {
        db.createObjectStore(collection, {
          keyPath: "id",
          autoIncrement: false,
        });
      }
    },
  });
};

export const getItemByIdIntroConclude = async (
  id: number,
  collection: string = "intro_conclude"
) => {
  const db = await initializeDBIntroConclude(collection);
  const tx = db.transaction(collection, "readonly");
  const store = tx.objectStore(collection);
  const item = await store.get(id);
  return item;
};

export const createOrUpdateItemIntroConclude = async (
  item: { id: number; data: any },
  collection: string = "intro_conclude"
) => {
  const db = await initializeDBIntroConclude(collection);
  const tx = db.transaction(collection, "readwrite");
  const store = tx.objectStore(collection);
  await store.put(item);
  await tx.done;
};

export const deleteItemByIdIntroConclude = async (
  id: number,
  collection: string = "intro_conclude"
) => {
  const db = await initializeDBIntroConclude(collection);
  const tx = db.transaction(collection, "readwrite");
  const store = tx.objectStore(collection);
  await store.delete(id);
  await tx.done;
};
