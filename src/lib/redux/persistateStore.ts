"use client"
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

const storage = createWebStorage("local")

export default storage;