"use client";
import { userLoginSliceReducer } from "./../userlogin/userlogin.slice";


const combinedReducer = {
  ...userLoginSliceReducer,
};

export * from "./../userlogin/userlogin.slice";
export default combinedReducer;
