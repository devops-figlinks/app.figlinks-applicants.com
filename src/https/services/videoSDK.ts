import { $fetch } from "../fetch";
import { BASEURL } from "@/helpers/getBaseURL";
export const getVideoSDKTokenAPI = async () => {
  try {
    return await $fetch.get(`/auth/videosdk`);
  } catch (err) {
    throw err;
  }
};

export const getSessionsByRoomIdAPI = async ({
  token,
  meetingId,
}: {
  token: string;
  meetingId: string;
}) => {
  try {
    const url = BASEURL + `/meeting/sessions?roomId=${meetingId}`;

    const options = {
      method: "GET",
      headers: {
        authorization: `${token}`,
        "Content-Type": "application/json",
      },
    };
    const response = await fetch(url, options);
    if (response.status === 200 || response.status === 201) {
      return await response.json();
    } else {
      throw response;
    }
  } catch (err) {
    throw err;
  }
};
