import cryptoJS from "crypto-js";

const serviceSecretKey = process.env
  .NEXT_PUBLIC_VIDEO_SDK_SERVICE_SECRET_KEY as string;
export const decodeToVideoSDKToken = (token: string) => {
  const bytes = cryptoJS.AES.decrypt(token, serviceSecretKey);
  return bytes.toString(cryptoJS.enc.Utf8);
};
