"use client";

import { participantSliceReducer } from "./participant.slice";

const combinedReducer = {
  ...participantSliceReducer,
};

export * from "./participant.slice";

export default combinedReducer;
