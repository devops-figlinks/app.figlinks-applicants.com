import { Button } from "@/components/ui/button";
import { IMobileBottomActionBarInMeeting } from "@/lib/interfaces/meeting";
import { motion } from "framer-motion";
import Image from "next/image";
import { FC, useEffect, useState } from "react";

const MobileBottomActionBarInMeeting: FC<IMobileBottomActionBarInMeeting> = ({
  questions,
  questionNo,
  micOn,
  webcamOn,
  showNextButtonOrNot,
  toggleMic,
  openMicAndSpeakerOptions,
  toggleWebcam,
  openCameraOptions,
  leaveTheMeeting,
  startTheNextQuestion,
  submitError,
  submitInterviewForTesting,
  joined,
  cameraPermission,
  isInterviewComplete,
  isIosInterview,
  onIOSPlayClick,
  audioDataRef,

  isTimerCompleted,
  handleManualNextQuestion,
  interviewType,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTooltip2, setShowTooltip2] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isCameraAllowed =
    cameraPermission === "granted" || cameraPermission === "prompt";
  const isIOS = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) || 
           (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  };

  const handleCameraClick = () => {
    if (joined === "JOINED") {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    } else {
      toggleWebcam();
    }
  };

  const handleMicClick = () => {
    if (joined === "JOINED") {
      setShowTooltip2(true);
      setTimeout(() => setShowTooltip2(false), 2000);
    } else {
      toggleMic();
    }
  };
  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 2000;

    if (submitError && submitInterviewForTesting && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        if (submitInterviewForTesting) {
          submitInterviewForTesting();
          setRetryCount((prev) => prev + 1);
        }
      }, retryDelay);
      return () => clearTimeout(timer);
    }
  }, [submitError, submitInterviewForTesting, retryCount]);

  const isLastQuestion = questionNo === questions.length - 1;
const shouldShowNextButton = !isInterviewComplete && 
    (showNextButtonOrNot || (isIOS() && isTimerCompleted)) && 
    (startTheNextQuestion || handleManualNextQuestion);

  const getNextButtonHandler = () => {
    if (isIOS() && interviewType !== "MCQ" && isTimerCompleted) {
      return handleManualNextQuestion;
    }
    if (interviewType === "MCQ") {
      return startTheNextQuestion;
    }
    return startTheNextQuestion;
  };

  const getButtonText = () => {
    if (isIOS() && interviewType !== "MCQ" && isTimerCompleted) {
      return "Timer Completed - Next";
    }
    return "Next";
  };

  const shouldShowPlayButton = isIOS() &&
    isIosInterview &&
    !isInterviewComplete &&
    !isTimerCompleted &&
    !shouldShowNextButton;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center items-center pointer-events-none gap-4 shadow-none">
      <div className="flex gap-4 items-center justify-center rounded-2xl shadow-lg pointer-events-auto">
        <div className="flex items-center gap-1 bg-[#545961] rounded-2xl p-0 pr-2 h-[34px] relative">
          <div
            className={`flex items-center justify-center ${
              joined === "JOINED" ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            onClick={handleMicClick}
          >
            <Image
              height={35}
              width={35}
              alt="Microphone"
              src={micOn ? "/interviews/mic-on.svg" : "/interviews/mic-off.svg"}
            />
            {showTooltip2 && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#333] text-white px-2.5 py-1.25 rounded text-xs mt-1.25 whitespace-nowrap">
                You cannot disable the audio
              </div>
            )}
          </div>
          <div
            className="flex justify-center items-center cursor-pointer p-1"
            onClick={openMicAndSpeakerOptions}
          >
            <Image
              height={15}
              width={15}
              alt="Audio Options"
              src="/interviews/up-arrow.svg"
            />
          </div>
        </div>

        <div
          className="flex justify-center items-center gap-1 bg-[#545961] rounded-2xl p-0 pr-2 h-[34px] relative"
          onClick={handleCameraClick}
        >
          <div
            className={
              joined === "JOINED" ? "cursor-not-allowed" : "cursor-pointer"
            }
          >
            <Image
              height={35}
              width={35}
              alt="Camera"
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
            className={`flex items-center justify-center p-1 ${
              joined === "JOINED" ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            onClick={joined === "JOINED" ? () => {} : openCameraOptions}
          >
            <Image
              height={15}
              width={15}
              alt="Camera Options"
              src="/interviews/up-arrow.svg"
            />
          </div>
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#333] text-white px-2 py-1 rounded text-xs mt-1">
              You cannot disable the camera
            </div>
          )}
        </div>

        <div
          className="cursor-pointer flex items-center justify-center"
          onClick={leaveTheMeeting}
        >
          <Image
            height={40}
            width={50}
            alt="Leave Call"
            src="/interviews/CallEndIcon.svg"
          />
        </div>
      </div>

      <div
        className="sticky bottom-0 right-0 flex gap-4 items-center justify-center rounded-2xl shadow-lg pointer-events-auto"
        style={{
          right: "2em",
          bottom: "1.6em",
        }}
      >
        {isInterviewComplete && submitInterviewForTesting && submitError ? (
          <Button
            className="bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] text-red p-2 rounded-lg"
            variant="default"
            onClick={() => {
              if (submitInterviewForTesting) {
                submitInterviewForTesting();
              }
            }}
          >
            Submit
          </Button>
        ) : shouldShowNextButton ? (
          <motion.div
            className="box"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1.5,
              delay: 0.5,
              ease: [0, 0.71, 0.2, 1.01],
            }}
          >
            <div className="">
              <button
                onClick={getNextButtonHandler()}
                title={getButtonText()}
              >
                <Image
                  src="/interviews/next-icon.svg"
                  height={35}
                  width={35}
                  alt={getButtonText()}
                />
              </button>
            </div>
          </motion.div>
        ) : shouldShowPlayButton ? (
          <button
            onClick={(e) => onIOSPlayClick(audioDataRef?.current, e)}
          >
            <Image
              src="/interviews/next-icon.svg"
              height={35}
              width={35}
              alt="Start Interview"
            />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default MobileBottomActionBarInMeeting;