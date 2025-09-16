"use client";
import { configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
} from "redux-persist";
import { combinedReducer } from "./Modules";
import pesistStorage from "./persistateStore";

const persistConfig = {
  key: "interview",
  version: 1,
  storage: pesistStorage,
  REHYDRATE: false,
};

const persistedReducer = persistReducer(persistConfig, combinedReducer);

export const store: any = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
