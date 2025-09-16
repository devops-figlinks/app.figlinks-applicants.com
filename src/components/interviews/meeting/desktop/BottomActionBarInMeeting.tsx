import { Badge } from "@/components/ui/badge";
import { IBottomActionBarInMeeting } from "@/lib/interfaces/meeting";
import Image from "next/image";
import { FC } from "react";

const BottomActionBarInMeeting: FC<IBottomActionBarInMeeting> = ({
  micOn,
  webcamOn,
  cameraPermission,
  microphonePermission,
  toggleMic,
  openMicAndSpeakerOptions,
  toggleWebcam,
  openCameraOptions,
  leaveTheMeeting,
  joined,
}) => {
  const isMicrophoneAllowed = microphonePermission === "granted" || microphonePermission === "prompt";
  const isCameraAllowed = cameraPermission === "granted" || cameraPermission === "prompt";


  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[rgba(255,255,255,0.2)] shadow-[0.96px_-0.96px_6.72px_0px_rgba(255,255,255,0.1)_inset,0px_0.853px_20.483px_-0.853px_rgba(0,0,0,0.18)] backdrop-blur-[24.48px] py-2 h-fit rounded-b-2xl">
      <div className="flex items-center justify-center gap-2">
        <div
          className="flex items-center justify-center gap-1.25 bg-[#545961] rounded-2xl p-0 pr-2.5 h-[35px] relative"
        >
          <div
            onClick={() => (joined == "JOINED" ? "" : toggleMic())}
            style={{ cursor: joined == "JOINED" ? "not-allowed" : "pointer" }}
            title={joined == "JOINED" ? "You can't disable the audio" : ""}
          >
            {!isMicrophoneAllowed && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                !
              </span>
            )}
            <Image
              height={35}
              width={35}
              alt=""
              src={
                isMicrophoneAllowed
                  ? micOn
                    ? "/interviews/mic-on.svg"
                    : "/interviews/mic-off.svg"
                  : "/interviews/mic-off.svg"
              }
            />
          </div>
          <div className="cursor-pointer flex justify-center items-center"
            onClick={openMicAndSpeakerOptions}
          >
            <Image
              height={15}
              width={15}
              alt=""
              src="/interviews/up-arrow.svg"
            />
          </div>
        </div>
        <div
          className="flex items-center justify-center gap-1.25 bg-[#545961] rounded-2xl p-0 pr-2.5 h-[35px] relative"
          title={joined == "JOINED" ? "You can't disable the camera" : ""}
        >
          <div
            onClick={() => (joined == "JOINED" ? "" : toggleWebcam())}
            style={{ cursor: joined == "JOINED" ? "not-allowed" : "pointer" }}
          >
            {!isCameraAllowed && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                !
              </span>
            )}
            <Image
              height={35}
              width={35}
              alt=""
              src={
                joined === "JOINED"
                  ? "/interviews/camera-on.svg"
                  : isCameraAllowed
                    ? webcamOn
                      ? "/interviews/camera-on.svg"
                      : "/interviews/camera-off.svg"
                    : "/interviews/camera-off.svg"
              }
            />
          </div>
          <div
            style={{
              cursor: joined == "JOINED" ? "not-allowed" : "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onClick={joined == "JOINED" ? () => { } : openCameraOptions}
          >
            <Image
              height={15}
              width={15}
              alt=""
              src="/interviews/up-arrow.svg"
            />
          </div>
        </div>
        <div onClick={leaveTheMeeting} className="cursor-pointer">
          <Image
            height={40}
            width={50}
            alt=""
            src="/interviews/CallEndIcon.svg"
          />
        </div>
      </div>
    </div>
  );
};

export default BottomActionBarInMeeting;
