"use client";
import Loading from "@/components/core/Loading";
import useMcqMeetingHook from "@/lib/hooks/meeting/useMcqMeetingHook";
import { IMcqExamBlock, IQuestioningBlock } from "@/lib/interfaces/meeting";
import Image from "next/image";
import { FC } from "react";
import McqQuestionsComponent from "../McqQuestionsComponent";
import McqParticipantView from "../desktop/McqParticipantView";
import { timerColor } from "@/lib/helpers/timerColors";
import { Button } from "@/components/ui/button";

const MobileMcqExamScreen: FC<IMcqExamBlock & IQuestioningBlock> = (props) => {
  const {
    interviewData,
    questions,
    questionNo,
    setInterviewTimes,
    submitError,
    setSubmitError,
    counts,
    setCounts,
    capturedImages,
    setCapturedImages,
    isRecording,
    participantId,
    participants,
    setJoined,
    audioDevicesList,
    videoDevicesList,
    playbackDevicesList,
    selectedCam,
    joined,
    selectedMic,
    selectedPlayback,
    meetingId,
    changeMicForTimer,
    botSpeechDuration,
    setBotSpeechDuration,
    questionDuration,
    setQuestionDuration,
    isInterviewStarted,
    botSpeechRendered,
    setBotSpeechRendered,
    isMicOnInMeeting,
    isWebcamOnInMeeting,
    setIsWebcamOnInMeeting,
    setIsMicOnInMeeting,
    selectedCamInMeet,
    selectedMicInMeet,
    selectedSpeakerInMeet,
    setSelectedCamInMeet,
    setSelectedMicInMeet,
    setSelectedSpeakerInMeet,
    setTimer,
    isInterviewComplete,
    setIsInterviewCompleted,

    setQuestions,
    setIsSettingUpInterview,
    isSettingUpInterview,
    isIntroduction,
    setIsIntroduction,
    setIsInterviewStarted,
    cameraPermission,
    microphonePermission,
    startTheNextQuestion,
    audioRef,
    videoSDKToken,
    startRec,
    setInterviewData,
    detectionCounts,
    endCall,
    setEndCall,
    questionAnswers,
    interviewTimes,
    setQuestionAnswers,
    videoStreamOff,
    setVideoStreamOff,
    interviewType,
    setInterviewType,
    isSafari,
  } = props;
  const {
    currentStage,
    selectedAnswers,
    currentQuestion,
    questionText,
    questionId,
    options,
    remainingTime,
    timer1,
    getMinAndSecsFromSecs,
    submittingInterview,
    isOptionSelected,
    handleOptionSelect,
    handleNext,
    handleSubmit,
  } = useMcqMeetingHook(props);

  return (
    <div className="flex flex-col h-screen bg-[#2d2d2d] text-white p-5 box-border capitalize rounded-none">
      <div className="flex justify-between items-center mb-4 bg-[#2d2d2d] border-0">
        {currentStage === "questions" && (
          <p className="text-white text-base font-medium capitalize">
            {questionNo + 1}/{questions.length}
          </p>
        )}
        {currentStage === "questions" && (
          <div className="flex items-center text-[#fcfcfc] text-base font-medium capitalize gap-1.25">
            {remainingTime > 0 && (
              <p className="bg-white px-3 py-1 rounded-sm flex items-center gap-2">
                <Image
                  src="/mcq-mobile/timer-icon.svg"
                  width={20}
                  height={20}
                  alt=""
                />
                <div className="flex items-center gap-2 text-[#ff6347] text-xs 3xl:!text-sm font-normal leading-[100%] capitalize m-0">
                  <span
                    style={{
                      fontSize: "13px",
                      color: timerColor(remainingTime),
                    }}
                  >
                    {getMinAndSecsFromSecs(remainingTime)}
                  </span>
                </div>
              </p>
            )}
          </div>
        )}
      </div>
      <div className="text-right mb-2 flex justify-end rounded-lg">
        {participants &&
          [...participants.keys()].map((participantId, index) => (
            <McqParticipantView
              key={index}
              participantId={participantId}
              setSubmitError={setSubmitError}
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
              setIsWebcamOnInMeeting={setIsWebcamOnInMeeting}
              setIsMicOnInMeeting={setIsMicOnInMeeting}
              selectedCamInMeet={selectedCamInMeet}
              selectedMicInMeet={selectedMicInMeet}
              selectedSpeakerInMeet={selectedSpeakerInMeet}
              setSelectedCamInMeet={setSelectedCamInMeet}
              setSelectedMicInMeet={setSelectedMicInMeet}
              setSelectedSpeakerInMeet={setSelectedSpeakerInMeet}
              interviewData={interviewData}
              cameraPermission={cameraPermission}
              microphonePermission={microphonePermission}
              audioRef={audioRef}
              setInterviewData={setInterviewData}
              questions={questions}
              questionNo={questionNo}
              counts={counts}
              setCounts={setCounts}
              capturedImages={capturedImages}
              setCapturedImages={setCapturedImages}
              submitError={submitError}
              detectionCounts={detectionCounts}
              isInterviewComplete={isInterviewComplete}
              isRecording={isRecording}
              interviewType={interviewType}
              setInterviewType={setInterviewType}
              currentStage={currentStage}
              videoStreamOff={videoStreamOff}
              setVideoStreamOff={setVideoStreamOff}
              isSafari={isSafari}
            />
          ))}
      </div>
      <McqQuestionsComponent
        currentStage={currentStage}
        interviewData={interviewData}
        questionNo={questionNo}
        questionText={questionText}
        selectedAnswers={selectedAnswers}
        setInterviewTimes={setInterviewTimes}
        questionId={questionId}
        options={options}
        isOptionSelected={isOptionSelected}
        handleOptionSelect={handleOptionSelect}
      />
      <Button
        variant="ghost"
        className="fixed bottom-8 right-8 rounded-md bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] text-white text-base font-normal cursor-pointer capitalize px-4 py-1 hover:bg-gradient-to-r hover:from-[#430ca6] hover:via-[#a533cf] hover:to-[#ec6d78]"
        onClick={
          currentStage === "questions" && questionNo === questions.length - 1
            ? handleSubmit
            : currentStage === "intro"
              ? handleNext
              : handleNext
        }
      >
        <div className="flex items-center gap-2">
          <span>
            {currentStage === "intro"
              ? "Start Questions"
              : currentStage === "questions" &&
                  questionNo === questions.length - 1
                ? "Finish & submit"
                : currentStage === "questions"
                  ? "Next"
                  : "Finish & submit"}
          </span>
          <Image
            src="/mcq-mobile/arrow-right.svg"
            alt=""
            width={25}
            height={25}
          />
        </div>
      </Button>
      <Loading
        loading={submittingInterview}
        label={"Submitting Interview, please wait...!\nDon't refresh the page"}
      />
    </div>
  );
};
export default MobileMcqExamScreen;
