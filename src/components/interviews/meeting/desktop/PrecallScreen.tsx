"use client";
import StreamVideoPlayer from "@/components/core/meeting/StreamVideoPlayer";
import { stringAvatar } from "@/helpers/muiAvatar";
import { Button } from "@/components/ui/button";
import { IPrecallScreen } from "@/lib/interfaces/meeting";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { is } from "date-fns/locale";
import { DropDownForDevices } from "@/components/core/meeting/DropDownForDevices";

const PrecallScreen = ({
  videoStream,
  participantName,
  onMicTrigger,
  audioStream,
  onCamTrigger,
  selectedMic,
  audioDevicesList,
  selectedCam,
  handleCamChange,
  videoDevicesList,
  selectedPlayback,
  handlePlaybackDeviceChange,
  playbackDevicesList,
  joinMeeting,
  isPlaying,
  audioProgress,
  testSpeakers,
  interviewData,
  handleMicChange,
  cameraPermission,
  microphonePermission,
  setInterviewData,
  camOnOrNot,
  micOnOrNot,
  interviewType,
  isSafari,
}: IPrecallScreen) => {
  const getDisabledReason = () => {
    if (interviewType === "MCQ") {
      if (!camOnOrNot) {
        return "Please select a camera";
      }
      return "";
    } else {
      if (playbackDevicesList.length === 0 && isSafari) {
        return "Your browser was not  allowed permissions to access your speakers.Allow them manually";
      }
      else if (!micOnOrNot && !camOnOrNot) {
        return "Please select a camera and microphone";
      } else if (!micOnOrNot) {
        return "Please select a microphone";
      } else if (!camOnOrNot) {
        return "Please select a camera";
      }

      return "";
    };
  }

  const isMicrophoneAllowed = microphonePermission === "granted" || microphonePermission === "prompt";
  const isCameraAllowed = cameraPermission === "granted" || cameraPermission === "prompt";

  return (
    <div className="bg-[url('/interview@3x.png')] bg-cover bg-top min-h-screen py-8">
      <div className="mx-auto w-[60%] rounded-2xl bg-white p-6 shadow-md flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl leading-[24px] font-medium bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] bg-clip-text text-transparent capitalize">
              {interviewData?.title}
            </h2>
          </div>
          <div className="flex items-end justify-end">
            {interviewData?.company?.logo ? (
              <Image
                alt=""
                src={interviewData?.company?.logo || "/interviews/fig-links-logo.svg"}
                width={80}
                height={80}
                onError={() => {
                  setInterviewData((prev: any) => ({
                    ...prev,
                    company: {
                      ...prev.company,
                      logo: "/interviews/fig-links-logo.svg",
                    },
                  }));
                }}
              />
            ) : (
              <Image
                src={"/interviews/fig-links-logo.svg"}
                width={60}
                height={60}
                alt="fig-links-logo"
              />
            )}
          </div>
        </div>

        <div className="w-[90%] mx-auto rounded-lg bg-[#121212] relative overflow-hidden h-[calc(100vh-340px)]">
          <div className="w-full h-full">
            {videoStream ? (
              <StreamVideoPlayer
                videoStream={videoStream}
                height="[100%]"
                width="[100%]"
              />
            ) : (
              <div className="w-[100px] h-[100px] flex justify-center items-center">
                <Avatar {...stringAvatar(participantName as string)} />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-white/20 p-1 rounded-b-lg shadow-md">
              <div className="flex justify-center gap-2 items-center">
                {interviewType != "MCQ" && (
                  <div onClick={!isSafari ? onMicTrigger : undefined} style={{ cursor: `${isSafari ? "not-allowed" : "pointer"}` }}>
                    <Badge
                      className={
                        !isMicrophoneAllowed
                          ? "bg-orange-500 text-white rounded-full w-3 h-4 absolute top-0"
                          : "hidden"
                      }
                    >
                      !
                    </Badge>

                    <Image
                      height={35}
                      width={35}
                      alt="mic"
                      src={
                        isMicrophoneAllowed
                          ? audioStream
                            ? "/interviews/mic-on.svg"
                            : "/interviews/mic-off.svg"
                          : "/interviews/mic-off.svg"
                      }
                    />
                  </div>
                )}
                <div onClick={!isSafari ? onCamTrigger : undefined} style={{ cursor: `${isSafari ? "not-allowed" : "pointer"}` }}>
                  <Badge
                    className={
                      !isCameraAllowed
                        ? "bg-orange-500 text-white rounded-full w-3 h-4 absolute top-0"
                        : "hidden"
                    }
                  >
                    !
                  </Badge>
                  <Image
                    height={35}
                    width={35}
                    alt="cam"
                    src={
                      isCameraAllowed ? videoStream
                        ? "/interviews/camera-on.svg"
                        : "/interviews/camera-off.svg"
                        : "/interviews/camera-off.svg"
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "grid gap-4 items-center",
            interviewType === "MCQ"
              ? "grid-cols-1 justify-items-center"
              : "grid-cols-3"
          )}
        >
          {interviewType !== "MCQ" && (
            <DropDownForDevices
              key="audio_devices"
              selectedDevice={selectedMic}
              onChangeDevice={handleMicChange}
              mediaDevicesList={audioDevicesList}
              iconSrc="/interviews/MicrophoneIcon.svg"
            />
          )}
          <div className={interviewType === "MCQ" ? "w-full max-w-xs" : ""}>
            <DropDownForDevices
              key="video_devices"
              selectedDevice={selectedCam}
              onChangeDevice={handleCamChange}
              mediaDevicesList={videoDevicesList}
              iconSrc="/interviews/VideoIcon.svg"
            />
          </div>
          {interviewType !== "MCQ" && (
            <DropDownForDevices
              key="speaker_devices"
              selectedDevice={selectedPlayback}
              onChangeDevice={handlePlaybackDeviceChange}
              mediaDevicesList={playbackDevicesList}
              iconSrc="/interviews/speakerIcon.svg"
              id="test_speaker"
              isPlaying={isPlaying}
              audioProgress={audioProgress}
              testSpeakers={testSpeakers}
            />
          )}
        </div>

        <div className="flex justify-center">
          <Button
            disabled={!!getDisabledReason()}
            className={`rounded-md px-8 py-2 text-white text-sm font-normal capitalize transition-all cursor-pointer ${getDisabledReason()
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] hover:animate-gradient-x"
              }`}
            onClick={joinMeeting}
          >
            Start Interview
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrecallScreen;
