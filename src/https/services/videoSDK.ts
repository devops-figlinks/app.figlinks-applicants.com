import { $fetch } from "../fetch";
import { BASEURL } from "@/helpers/getBaseURL";

export const verifyFaceAPI = async ({
  token,
  referenceImage,
  currentImage,
}: {
  token: string;
  referenceImage: string;
  currentImage: string;
}): Promise<{ is_same_person: boolean; confidence: number }> => {
  const response = await fetch(
    "https://api.videosdk.live/ai/v1/face-verification/verify",
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ img1: referenceImage, img2: currentImage }),
    }
  );
  if (response.status === 200 || response.status === 201) {
    const data = await response.json();
    return { is_same_person: data.verified, confidence: data.score };
  }
  throw await response.json().catch(() => response);
};

export const detectFacesAPI = async ({
  token,
  imageBase64,
}: {
  token: string;
  imageBase64: string;
}): Promise<{ number_of_faces: number }> => {
  const response = await fetch(
    "https://api.videosdk.live/ai/v1/face-verification/detect-faces",
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ img: imageBase64 }),
    }
  );
  if (response.status === 200 || response.status === 201) {
    return await response.json();
  }
  throw await response.json().catch(() => response);
};

export const detectSpoofAPI = async ({
  token,
  imageBase64,
}: {
  token: string;
  imageBase64: string;
}): Promise<{ spoof_detected: boolean; accuracy: number }> => {
  const response = await fetch(
    "https://api.videosdk.live/ai/v1/face-verification/detect-spoof",
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ img: imageBase64 }),
    }
  );
  if (response.status === 200 || response.status === 201) {
    return await response.json();
  }
  throw await response.json().catch(() => response);
};

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
