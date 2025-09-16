import { combineReducers } from "@reduxjs/toolkit";
import userLoginReducer from "./userlogin";
import participantReducer from "./participant";

export const combinedReducer = combineReducers({
  ...userLoginReducer,
  ...participantReducer,
});
