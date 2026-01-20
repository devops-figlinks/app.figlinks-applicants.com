import Loading from "@/components/core/Loading";
import { DropDownForDevices } from "@/components/core/meeting/DropDownForDevices";
import StreamVideoPlayer from "@/components/core/meeting/StreamVideoPlayer";
import { stringAvatar } from "@/helpers/muiAvatar";
import { useDisableZoom } from "@/lib/hooks/disableZoomHook";
import useMeetingHook from "@/lib/hooks/meeting/useMeetingHook";
import {
  IMeetingViewWebAndMobile,
  IUseMeetingHookReturnType,
} from "@/lib/interfaces/meeting";
import { motion } from "framer-motion";
import Image from "next/image";
import { FC, useEffect, useState } from "react";
import MobileParticipantView from "./MobileParticipantView";
import MobileMcqExamScreen from "./MobileExamScreen";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DeviceInfo } from "@videosdk.live/react-sdk";

const MobileMeetingView: FC<IMeetingViewWebAndMobile> = ({
  participantName,
  meetingId,
  interviewData,
  questions,
  videoSDKToken,
  onMeetingLeave,
  setMicOnOrNot,
  setCamOnOrNot,
  setQuestions,
  setInterviewData,
  webHookObj,
  micOnOrNot,
  camOnOrNot,
}) => {
  useDisableZoom();

  const {
    timer,
    joined,
    participants,
    audioStream,
    audioDevicesList,
    videoDevicesList,
    playbackDevicesList,
    selectedCam,
    selectedMic,
    selectedPlayback,
    questionNo,
    botSpeechDuration,
    isInterviewComplete,
    videoStream,
    isPlaying,
    audioProgress,
    participantCount,
    loading,
    isSettingUpInterview,
    questionDuration,
    isIntroduction,
    isInterviewStarted,
    botSpeechRendered,
    // audioBlobForNextQuestion,
    isMicOnInMeeting,
    isWebcamOnInMeeting,
    selectedCamInMeet,
    selectedMicInMeet,
    selectedSpeakerInMeet,
    cameraPermission,
    microphonePermission,
    audioRef,
    setTimer,
    setSelectedCamInMeet,
    setSelectedMicInMeet,
    setSelectedSpeakerInMeet,
    setIsWebcamOnInMeeting,
    setIsMicOnInMeeting,
    // setAudioBlobForNextQuestion,
    setBotSpeechRendered,
    setIsInterviewStarted,
    setIsIntroduction,
    setQuestionDuration,
    onMicTrigger,
    setJoined,
    setSelectedCam,
    changeMicForTimer,
    startRec,
    setBotSpeechDuration,
    setIsInterviewCompleted,
    onCamTrigger,
    handlePlaybackDeviceChange,
    handleMicChange,
    handleCamChange,
    testSpeakers,
    joinMeeting,
    setIsSettingUpInterview,
    startTheNextQuestion,
    isRecording,
    counts,
    setCounts,
    capturedImages,
    setCapturedImages,

    submitError,
    setSubmitError,
    detectionCounts,
    endCall,
    setEndCall,
    interviewType,
    questionAnswers,
    interviewTimes,
    setQuestionAnswers,
    setInterviewTimes,
    setInterviewType,
    setCurrentStage,
    currentStage,
    videoStreamOff,
    setVideoStreamOff,
    isSafari,
  }: IUseMeetingHookReturnType = useMeetingHook({
    onMeetingLeave,
    meetingId,
    setMicOnOrNot,
    setCamOnOrNot,
    interviewData,
    questions,
    setQuestions,
    videoSDKToken,
    webHookObj,
  });
  const isMicrophoneAllowed =
    microphonePermission === "granted" || microphonePermission === "prompt";
  const isCameraAllowed =
    cameraPermission === "granted" || cameraPermission === "prompt";

  const [openQuestions, setOpenQuestions] = useState(false);
  useEffect(() => {
    if (joined == "JOINED") {
      setTimeout(() => {
        setOpenQuestions(true);
      }, 1000);
    } else {
      setOpenQuestions(false);
    }
  }, [joined]);

  useEffect(() => {
    if (interviewType !== "MCQ" && audioDevicesList.length > 0) {
      type DeviceWithPriority = { device: DeviceInfo; priority: number };
      const preferredDevices: DeviceWithPriority[] = [];
      audioDevicesList.forEach((device) => {
        const lowerLabel = device.label.toLowerCase();
        const isAudioInput = device.kind === "audioinput";

        if (!isAudioInput) return;
        const isWiredHeadset = lowerLabel.includes("wired headset");
        const isBluetoothDevice =
          lowerLabel.includes("bluetooth") ||
          (lowerLabel.includes("headset") &&
            !lowerLabel.includes("earpiece") &&
            !lowerLabel.includes("wired"));
        const isSpeakerphone = lowerLabel.includes("speakerphone");

        if (isWiredHeadset) {
          preferredDevices.push({ device, priority: 1 });
        } else if (isBluetoothDevice) {
          preferredDevices.push({ device, priority: 2 });
        } else if (isSpeakerphone) {
          preferredDevices.push({ device, priority: 3 });
        }
      });
      preferredDevices.sort((a, b) => a.priority - b.priority);

      let deviceToSelect: DeviceInfo | undefined;

      if (preferredDevices.length > 0) {
        deviceToSelect = preferredDevices[0].device;
      } else {
        deviceToSelect =
          audioDevicesList.find((device) =>
            device.label.toLowerCase().includes("speakerphone"),
          ) || audioDevicesList[0];
      }

      const currentSelectedDevice = audioDevicesList.find(
        (device) => device.deviceId === selectedMic,
      );

      if (
        !currentSelectedDevice ||
        currentSelectedDevice.deviceId !== deviceToSelect.deviceId
      ) {
        handleMicChange(deviceToSelect.deviceId);
      } else {
        
      }
    } else {
    }
  }, [audioDevicesList, selectedMic, handleMicChange, interviewType]);
  const getDisabledReason = () => {
    if (interviewType === "MCQ") {
      if (!camOnOrNot) {
        return "Please select a camera";
      }
      return "";
    } else {
      if (!micOnOrNot && !camOnOrNot) {
        return "Please select a camera and microphone";
      } else if (!micOnOrNot) {
        return "Please select a microphone";
      } else if (!camOnOrNot) {
        return "Please select a camera";
      }

      return "";
    }
  };

  return (
    <>
      {joined == "JOINED" && openQuestions ? (
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
          {[...participants.keys()].map((participantId) =>
            !(interviewType === "MCQ") ? (
              <MobileParticipantView
                submitError={submitError}
                setSubmitError={setSubmitError}
                counts={counts}
                setCounts={setCounts}
                capturedImages={capturedImages}
                setCapturedImages={setCapturedImages}
                isRecording={isRecording}
                participantId={participantId}
                key={participantId}
                setJoined={setJoined}
                audioDevicesList={audioDevicesList}
                videoDevicesList={videoDevicesList}
                playbackDevicesList={playbackDevicesList}
                selectedCam={selectedCam}
                joined={joined}
                selectedMic={selectedMic}
                selectedPlayback={selectedPlayback}
                meetingId={meetingId}
                changeMicForTimer={changeMicForTimer}
                botSpeechDuration={botSpeechDuration}
                setBotSpeechDuration={setBotSpeechDuration}
                questionDuration={questionDuration}
                setQuestionDuration={setQuestionDuration}
                isInterviewStarted={isInterviewStarted}
                botSpeechRendered={botSpeechRendered}
                setBotSpeechRendered={setBotSpeechRendered}
                isMicOnInMeeting={isMicOnInMeeting}
                isWebcamOnInMeeting={isWebcamOnInMeeting}
                setIsWebcamOnInMeeting={setIsWebcamOnInMeeting}
                setIsMicOnInMeeting={setIsMicOnInMeeting}
                selectedCamInMeet={selectedCamInMeet}
                selectedMicInMeet={selectedMicInMeet}
                selectedSpeakerInMeet={selectedSpeakerInMeet}
                setSelectedCamInMeet={setSelectedCamInMeet}
                setSelectedMicInMeet={setSelectedMicInMeet}
                setSelectedSpeakerInMeet={setSelectedSpeakerInMeet}
                setTimer={setTimer}
                //this was for questioning block
                questionNo={questionNo}
                isInterviewComplete={isInterviewComplete}
                setIsInterviewCompleted={setIsInterviewCompleted}
                questions={questions}
                setQuestions={setQuestions}
                setIsSettingUpInterview={setIsSettingUpInterview}
                isSettingUpInterview={isSettingUpInterview}
                isIntroduction={isIntroduction}
                setIsIntroduction={setIsIntroduction}
                // audioBlobForNextQuestion={audioBlobForNextQuestion}
                // setAudioBlobForNextQuestion={setAudioBlobForNextQuestion}
                interviewData={interviewData}
                setIsInterviewStarted={setIsInterviewStarted}
                cameraPermission={cameraPermission}
                microphonePermission={microphonePermission}
                startTheNextQuestion={startTheNextQuestion}
                audioRef={audioRef}
                videoSDKToken={videoSDKToken}
                startRec={startRec}
                setInterviewData={setInterviewData}
                detectionCounts={detectionCounts}
                endCall={endCall}
                setEndCall={setEndCall}
                currentStage={currentStage}
                setCurrentStage={setCurrentStage}
                videoStreamOff={videoStreamOff}
                setVideoStreamOff={setVideoStreamOff}
                isSafari={isSafari}
              />
            ) : (
              <MobileMcqExamScreen
                submitError={submitError}
                setSubmitError={setSubmitError}
                counts={counts}
                setCounts={setCounts}
                capturedImages={capturedImages}
                setCapturedImages={setCapturedImages}
                isRecording={isRecording}
                participantId={participantId}
                key={participantId}
                setJoined={setJoined}
                audioDevicesList={audioDevicesList}
                videoDevicesList={videoDevicesList}
                playbackDevicesList={playbackDevicesList}
                selectedCam={selectedCam}
                joined={joined}
                selectedMic={selectedMic}
                selectedPlayback={selectedPlayback}
                meetingId={meetingId}
                changeMicForTimer={changeMicForTimer}
                botSpeechDuration={botSpeechDuration}
                setBotSpeechDuration={setBotSpeechDuration}
                questionDuration={questionDuration}
                setQuestionDuration={setQuestionDuration}
                isInterviewStarted={isInterviewStarted}
                botSpeechRendered={botSpeechRendered}
                setBotSpeechRendered={setBotSpeechRendered}
                isMicOnInMeeting={isMicOnInMeeting}
                isWebcamOnInMeeting={isWebcamOnInMeeting}
                setIsWebcamOnInMeeting={setIsWebcamOnInMeeting}
                setIsMicOnInMeeting={setIsMicOnInMeeting}
                selectedCamInMeet={selectedCamInMeet}
                selectedMicInMeet={selectedMicInMeet}
                selectedSpeakerInMeet={selectedSpeakerInMeet}
                setSelectedCamInMeet={setSelectedCamInMeet}
                setSelectedMicInMeet={setSelectedMicInMeet}
                setSelectedSpeakerInMeet={setSelectedSpeakerInMeet}
                setTimer={setTimer}
                questionNo={questionNo}
                isInterviewComplete={isInterviewComplete}
                setIsInterviewCompleted={setIsInterviewCompleted}
                questions={questions}
                setQuestions={setQuestions}
                setIsSettingUpInterview={setIsSettingUpInterview}
                isSettingUpInterview={isSettingUpInterview}
                isIntroduction={isIntroduction}
                setIsIntroduction={setIsIntroduction}
                // audioBlobForNextQuestion={audioBlobForNextQuestion}
                // setAudioBlobForNextQuestion={setAudioBlobForNextQuestion}
                interviewData={interviewData}
                setIsInterviewStarted={setIsInterviewStarted}
                cameraPermission={cameraPermission}
                microphonePermission={microphonePermission}
                startTheNextQuestion={startTheNextQuestion}
                audioRef={audioRef}
                videoSDKToken={videoSDKToken}
                startRec={startRec}
                setInterviewData={setInterviewData}
                detectionCounts={detectionCounts}
                endCall={endCall}
                setEndCall={setEndCall}
                questionAnswers={questionAnswers}
                interviewTimes={interviewTimes}
                setQuestionAnswers={setQuestionAnswers}
                setInterviewTimes={setInterviewTimes}
                interviewType={interviewType}
                setInterviewType={setInterviewType}
                participants={participants}
                currentStage={currentStage}
                setCurrentStage={setCurrentStage}
                videoStreamOff={videoStreamOff}
                setVideoStreamOff={setVideoStreamOff}
                isSafari={isSafari}
              />
            ),
          )}
        </motion.div>
      ) : (
        <div className="bg-[url('/interview@3x.png')] bg-cover bg-no-repeat bg-top py-8.64 min-h-screen box-border">
          <div className="shadow-none rounded-2xl bg-transparent flex flex-col p-6 w-[100%] mx-auto">
            <div className="flex items-start justify-around gap-3 shadow-[0_0_9px_rgba(0,0,0,0.14)] bg-white p-1 rounded-md">
              <div className="flex justify-between items-center gap-3 py-1 px-3 w-full rounded-lg">
                <div className="bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] bg-clip-text text-transparent text-base font-normal leading-[120%] capitalize">
                  {interviewData?.title}
                </div>
                {interviewData?.company?.logo ? (
                  <img
                    alt=""
                    src={interviewData?.company?.logo}
                    width={50}
                    height={50}
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <Image
                    src="/interviews/fig-links-logo.svg"
                    width={50}
                    height={50}
                    alt="fig-links-logo"
                  />
                )}
              </div>
            </div>

            <div className="w-[100%] mx-auto h-[40vh] rounded-xl bg-[#000000] relative mt-4  flex justify-center items-center">
              {videoStream ? (
                <StreamVideoPlayer
                  videoStream={videoStream}
                  selectedCam={selectedCam}
                  videoDevicesList={videoDevicesList}
                  height={"100%"}
                  width={"100%"}
                />
              ) : (
                <div className="w-[100px] h-[100px] flex justify-center items-center">
                  <Avatar {...stringAvatar(participantName as string)} />
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-transparent shadow-[0.891px_-0.891px_6.237px_0px_rgba(255,255,255,0.1)_inset,0px_0.792px_19.01px_-0.792px_rgba(0,0,0,0.18)] backdrop-blur-[22.72px] rounded-b-xl">
                <div className="flex items-center justify-center gap-2">
                  {interviewType != "MCQ" && (
                    <div onClick={onMicTrigger}>
                      <span className="inline-flex relative">
                        <Image
                          height={30}
                          width={30}
                          alt=""
                          src={
                            isMicrophoneAllowed
                              ? audioStream
                                ? "/interviews/mic-on.svg"
                                : "/interviews/mic-off.svg"
                              : "/interviews/mic-off.svg"
                          }
                        />
                        {!isMicrophoneAllowed && (
                          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            !
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  <div onClick={onCamTrigger}>
                    <span className="inline-flex relative">
                      <Image
                        height={30}
                        width={30}
                        alt=""
                        src={
                          isCameraAllowed
                            ? videoStream
                              ? "/interviews/camera-on.svg"
                              : "/interviews/camera-off.svg"
                            : "/interviews/camera-off.svg"
                        }
                      />
                      {!isCameraAllowed && (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          !
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 items-center my-8 w-[100%]">
              <div className="w-full">
                {interviewType != "MCQ" && (
                  <DropDownForDevices
                    key="audio_devices"
                    selectedDevice={selectedMic}
                    onChangeDevice={handleMicChange}
                    mediaDevicesList={audioDevicesList}
                    iconSrc="/interviews/MicrophoneIcon.svg"
                  />
                )}
              </div>
              <div className="w-full">
                <DropDownForDevices
                  key="video_devices"
                  selectedDevice={selectedCam}
                  onChangeDevice={handleCamChange}
                  mediaDevicesList={videoDevicesList}
                  iconSrc="/interviews/VideoIcon.svg"
                />
              </div>
              <div className="w-full">
                {interviewType != "MCQ" && (
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
            </div>

            <div className="flex items-center justify-center w-full">
              <Button
                disabled={!!getDisabledReason()}
                className={`rounded-sm text-white text-sm font-normal capitalize px-8 py-2 cursor-pointer w-full ${
                  getDisabledReason()
                    ? "bg-[#d0cece] cursor-not-allowed"
                    : "bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78]"
                }`}
                variant="default"
                onClick={joinMeeting}
              >
                Start Interview
              </Button>
            </div>
          </div>
        </div>
      )}

      <Loading
        loading={!!(joined && joined == "JOINING") || loading}
        label="Joining..."
      />
      <Loading
        loading={joined == "JOINED" && isSettingUpInterview}
        label="Setting up interview..."
      />
    </>
  );
};
export default MobileMeetingView;
