import { $fetch } from "@/https/fetch";

export const getTokenAPI = async () => {
  try {
    const response = await $fetch.get("/bot/get-ephemeral-token");
    return response;
  } catch (err) {
    throw err;
  }
};
