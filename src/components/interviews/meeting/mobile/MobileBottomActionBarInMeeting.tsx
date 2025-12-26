import { Button } from "@/components/ui/button";
import { IMobileBottomActionBarInMeeting } from "@/lib/interfaces/meeting";
import { motion } from "framer-motion";
import Image from "next/image";
import { FC, useEffect, useMemo, useState } from "react";

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
  const isIOSDevice = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    );
  }, []);

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
        submitInterviewForTesting();
        setRetryCount((prev) => prev + 1);
      }, retryDelay);
      return () => clearTimeout(timer);
    }
  }, [submitError, submitInterviewForTesting, retryCount]);

const shouldShowIOSPlayButton =
    isIOSDevice &&
    isIosInterview &&
    !isInterviewComplete &&
    !isTimerCompleted;

  const shouldShowNextButton =
    !isInterviewComplete &&
    !shouldShowIOSPlayButton &&
    (showNextButtonOrNot || (isIOSDevice && isTimerCompleted));

  const getNextButtonHandler = () => {
    if (isIOSDevice && interviewType !== "MCQ" && isTimerCompleted) {
      return handleManualNextQuestion;
    }
    return startTheNextQuestion;
  };

  const getButtonText = () => {
    if (isIOSDevice && interviewType !== "MCQ" && isTimerCompleted) {
      return "Timer Completed - Next";
    }
    return "Next";
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center items-center pointer-events-none gap-4">
      <div className="flex gap-4 items-center justify-center rounded-2xl shadow-lg pointer-events-auto">
        <div className="flex items-center gap-1 bg-[#545961] rounded-2xl pr-2 h-[34px] relative">
          <div
            className={joined === "JOINED" ? "cursor-not-allowed" : "cursor-pointer"}
            onClick={handleMicClick}
          >
            <Image
              height={35}
              width={35}
              alt="Microphone"
              src={micOn ? "/interviews/mic-on.svg" : "/interviews/mic-off.svg"}
            />
            {showTooltip2 && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#333] text-white px-2 py-1 rounded text-xs">
                You cannot disable the audio
              </div>
            )}
          </div>
          <div onClick={openMicAndSpeakerOptions} className="cursor-pointer p-1">
            <Image height={15} width={15} alt="Audio Options" src="/interviews/up-arrow.svg" />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#545961] rounded-2xl pr-2 h-[34px] relative">
          <div
            className={joined === "JOINED" ? "cursor-not-allowed" : "cursor-pointer"}
            onClick={handleCameraClick}
          >
            <Image
              height={35}
              width={35}
              alt="Camera"
              src={
                joined === "JOINED"
                  ? "/interviews/camera-on.svg"
                  : isCameraAllowed && webcamOn
                  ? "/interviews/camera-on.svg"
                  : "/interviews/camera-off.svg"
              }
            />
          </div>
          <div
            onClick={joined === "JOINED" ? undefined : openCameraOptions}
            className={joined === "JOINED" ? "cursor-not-allowed p-1" : "cursor-pointer p-1"}
          >
            <Image height={15} width={15} alt="Camera Options" src="/interviews/up-arrow.svg" />
          </div>
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#333] text-white px-2 py-1 rounded text-xs">
              You cannot disable the camera
            </div>
          )}
        </div>

        <div onClick={leaveTheMeeting} className="cursor-pointer">
          <Image height={40} width={50} alt="Leave Call" src="/interviews/CallEndIcon.svg" />
        </div>
      </div>

      <div
        className="sticky bottom-0 right-0 flex gap-4 items-center justify-center pointer-events-auto"
        style={{ right: "2em", bottom: "1.6em" }}
      >
        {isInterviewComplete && submitInterviewForTesting && submitError && (
          <Button
            className="bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78]"
            onClick={submitInterviewForTesting}
          >
            Submit
          </Button>
        )}

        {shouldShowNextButton && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <button onClick={getNextButtonHandler} title={getButtonText()}>
              <Image
                src="/interviews/next-icon.svg"
                height={35}
                width={35}
                alt={getButtonText()}
              />
            </button>
          </motion.div>
        )}
        {shouldShowIOSPlayButton && (
          <button onClick={(e) => onIOSPlayClick(audioDataRef?.current, e)}>
            <Image
              src="/interviews/next-icon.svg"
              height={35}
              width={35}
              alt="Start Interview"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileBottomActionBarInMeeting;
