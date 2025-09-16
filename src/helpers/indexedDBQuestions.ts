import { openDB, deleteDB } from "idb";
import { IQuesObj } from "@/lib/interfaces/meeting";

const DB_NAME = "interview";
const DB_VERSION = 1;

export const initializeDB = async (collection: string) => {
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

export const bulkUpsertItems = async (
  questions: IQuesObj[],
  collection: string = "questions",
) => {
  const db = await initializeDB(collection);
  const tx = db.transaction(collection, "readwrite");
  const store = tx.objectStore(collection);

  for (const item of questions) {
    const hasId = (item as any)?.id != null;
    const safeId = hasId ? (item as any).id : crypto.randomUUID();
    await store.put({ ...(item as any), id: safeId });
  }

  await tx.done;
};

export const getItemById = async (id: number | string, collection: string = "questions") => {
  const db = await initializeDB(collection);
  const tx = db.transaction(collection, "readonly");
  const store = tx.objectStore(collection);
  const item = await store.get(id);
  return item;
};

export const createOrUpdateItem = async (
  item: { id: number | string; data: any } | any,
  collection: string = "questions",
) => {
  const db = await initializeDB(collection);
  const tx = db.transaction(collection, "readwrite");
  const store = tx.objectStore(collection);

  const hasId = (item as any)?.id != null;
  const payload = hasId ? item : { ...(item as any), id: crypto.randomUUID() };
  await store.put(payload);

  await tx.done;
};

export const getAllItems = async (collection: string = "questions") => {
  const db = await initializeDB(collection);
  const tx = db.transaction(collection, "readonly");
  const store = tx.objectStore(collection);
  const questions = await store.getAll();
  questions.sort((a: any, b: any) =>
    a["order"] < b["order"] ? -1 : a["order"] > b["order"] ? 1 : 0,
  );
  return questions;
};

export const updateItem = async (
  id: number | string,
  updatedData: any,
  collection: string = "questions",
) => {
  const db = await initializeDB(collection);
  const tx = db.transaction(collection, "readwrite");
  const store = tx.objectStore(collection);
  const existingItem = await store.get(id);
  if (!existingItem) throw new Error("Item not found");
  const updatedItem = { ...existingItem, ...updatedData };
  await store.put(updatedItem);
  await tx.done;
};

export const deleteItem = async (id: number | string, collection: string = "questions") => {
  const db = await initializeDB(collection);
  const tx = db.transaction(collection, "readwrite");
  const store = tx.objectStore(collection);
  await store.delete(id);
  await tx.done;
};

export const deleteAllItems = async (collection: string = "questions") => {
  const db = await initializeDB(collection);
  const tx = db.transaction(collection, "readwrite");
  const store = tx.objectStore(collection);
  await store.clear();
  await tx.done;
};

export const deleteObject = async (dbName: string = DB_NAME) => {
  await deleteDB(dbName);
};
