"use client";
import { createSlice } from "@reduxjs/toolkit";

const reducerName = "participant";

export const initialState = {
  settings: {
    videoStream: false,
  },
};

export const participantSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    triggerParticipantCam: (
      state: any,
      action: { payload: MediaStream | null }
    ) => {
      state.settings.videoStream = action.payload;
    },
  },
});

export const { triggerParticipantCam } = participantSlice.actions;
export const participantSliceReducer = {
  [reducerName]: participantSlice.reducer,
};
