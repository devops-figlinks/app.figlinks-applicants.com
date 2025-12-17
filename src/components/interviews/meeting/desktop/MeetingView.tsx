import Loading from "@/components/core/Loading";
import { useDisableZoom } from "@/lib/hooks/disableZoomHook";
import useMeetingHook from "@/lib/hooks/meeting/useMeetingHook";
import {
  IMeetingViewWebAndMobile,
  IUseMeetingHookReturnType,
  QuestionAnswer,
} from "@/lib/interfaces/meeting";
import { motion } from "framer-motion";
import { FC, SetStateAction, useEffect, useState } from "react";
import ParticipantView from "./ParticipantView";
import PrecallScreen from "./PrecallScreen";
import QuestioningBlock from "./QuestioningBlock";
import ExamScreen from "./McqMeetingView";
import McqExamScreen from "./McqMeetingView";

const MeetingView: FC<IMeetingViewWebAndMobile> = ({
  onMeetingLeave,
  meetingId,
  participantName,
  setMicOnOrNot,
  setCamOnOrNot,
  micOnOrNot,
  camOnOrNot,
  interviewData,
  questions,
  setQuestions,
  videoSDKToken,
  setInterviewData,
  webHookObj,
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
    // questions,
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
    // interviewData,
    // audioBlobForNextQuestion,
    isMicOnInMeeting,
    isWebcamOnInMeeting,
    selectedCamInMeet,
    selectedMicInMeet,
    selectedSpeakerInMeet,
    cameraPermission,
    microphonePermission,
    audioRef,
    startRec,
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
    handleMicChange,
    setJoined,
    setSelectedCam,
    changeMicForTimer,
    // setQuestions,
    counts,
    setCounts,
    capturedImages,
    setCapturedImages,
    setBotSpeechDuration,
    setIsInterviewCompleted,
    onCamTrigger,
    handlePlaybackDeviceChange,
    handleCamChange,
    testSpeakers,
    joinMeeting,
    setIsSettingUpInterview,
    startTheNextQuestion,
    setTimer,
    isRecording,
    submitError,
    setSubmitError,
    detectionCounts,
    endCall,
    setEndCall,
    interviewType,
    setInterviewType,
    questionAnswers,
    setQuestionAnswers,
    interviewTimes,
    setInterviewTimes,
    currentStage,
    setCurrentStage,
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

  return (
    <>
      {joined == "JOINED" ? (
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
          <div className="bg-[url('/interview@3x.png')] bg-cover bg-no-repeat bg-top min-h-[100vh] box-border pt-8 pb-6">
            <div className="rounded-xl bg-white shadow-[0_0_9px_rgba(0,0,0,0.14)] p-4 w-[95%] mx-auto">
              {interviewType === "MCQ" ? (
                [...participants.keys()].map((participantId) => (
                  <McqExamScreen
                    key={participantId}
                    participantId={participantId}
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
                    setSubmitError={setSubmitError}
                    isInterviewComplete={isInterviewComplete}
                    setIsInterviewCompleted={setIsInterviewCompleted}
                    setQuestions={setQuestions}
                    setIsSettingUpInterview={setIsSettingUpInterview}
                    isSettingUpInterview={isSettingUpInterview}
                    isIntroduction={isIntroduction}
                    setIsIntroduction={setIsIntroduction}
                    isMicOnInMeeting={isMicOnInMeeting}
                    isWebcamOnInMeeting={isWebcamOnInMeeting}
                    startTheNextQuestion={startTheNextQuestion}
                    videoSDKToken={videoSDKToken}
                    startRec={startRec}
                    setTimer={setTimer}
                    isRecording={isRecording}
                    detectionCounts={detectionCounts}
                    setIsInterviewStarted={setIsInterviewStarted}
                    participants={participants}
                    questionAnswers={questionAnswers}
                    setQuestionAnswers={setQuestionAnswers}
                    interviewTimes={interviewTimes}
                    setInterviewTimes={setInterviewTimes}
                    interviewType={interviewType}
                    setInterviewType={setInterviewType}
                    currentStage={currentStage}
                    setCurrentStage={setCurrentStage}
                    endCall={endCall}
                    setEndCall={setEndCall}
                    videoStreamOff={videoStreamOff}
                    setVideoStreamOff={setVideoStreamOff}
                    isSafari={isSafari}
                  />
                ))
              ) : (
                <div className="grid grid-cols-[63%_35.5%] gap-4 items-start p-3">
                  <div className="rounded-xl relative h-[80vh] bg-[#000]">
                    {[...participants.keys()].map((participantId) => (
                      <ParticipantView
                        setSubmitError={setSubmitError}
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
                        endCall={endCall}
                        setEndCall={setEndCall}
                        videoStreamOff={videoStreamOff}
                        setVideoStreamOff={setVideoStreamOff}
                        isSafari={isSafari}
                      />
                    ))}
                  </div>
                  <div className="flex self-stretch">
                    <QuestioningBlock
                      detectionCounts={detectionCounts}
                      setSubmitError={setSubmitError}
                      submitError={submitError}
                      questionNo={questionNo}
                      isInterviewComplete={isInterviewComplete}
                      setIsInterviewCompleted={setIsInterviewCompleted}
                      questions={questions}
                      setQuestions={setQuestions}
                      setBotSpeechDuration={setBotSpeechDuration}
                      setIsSettingUpInterview={setIsSettingUpInterview}
                      isSettingUpInterview={isSettingUpInterview}
                      setQuestionDuration={setQuestionDuration}
                      isIntroduction={isIntroduction}
                      setIsIntroduction={setIsIntroduction}
                      // audioBlobForNextQuestion={audioBlobForNextQuestion}
                      // setAudioBlobForNextQuestion={setAudioBlobForNextQuestion}
                      interviewData={interviewData}
                      isInterviewStarted={isInterviewStarted}
                      setIsInterviewStarted={setIsInterviewStarted}
                      botSpeechRendered={botSpeechRendered}
                      setBotSpeechRendered={setBotSpeechRendered}
                      isMicOnInMeeting={isMicOnInMeeting}
                      isWebcamOnInMeeting={isWebcamOnInMeeting}
                      selectedSpeakerInMeet={selectedSpeakerInMeet}
                      startTheNextQuestion={startTheNextQuestion}
                      audioRef={audioRef}
                      videoSDKToken={videoSDKToken}
                      meetingId={meetingId}
                      startRec={startRec}
                      setTimer={setTimer}
                      isRecording={isRecording}
                      counts={counts}
                      setCounts={setCounts}
                      capturedImages={capturedImages}
                      setCapturedImages={setCapturedImages}
                      interviewType={interviewType}
                      questionAnswers={questionAnswers}
                      setQuestionAnswers={setQuestionAnswers}
                      interviewTimes={interviewTimes}
                      setInterviewTimes={setInterviewTimes}
                      setInterviewType={setInterviewType}
                      currentStage={currentStage}
                      setCurrentStage={setCurrentStage}
                      endCall={endCall}
                      setEndCall={setEndCall}
                      videoStreamOff={videoStreamOff}
                      setVideoStreamOff={setVideoStreamOff}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <PrecallScreen
          micOnOrNot={micOnOrNot}
          camOnOrNot={camOnOrNot}
          videoStream={videoStream}
          participantName={participantName as string}
          onMicTrigger={onMicTrigger}
          audioStream={audioStream}
          onCamTrigger={onCamTrigger}
          selectedMic={selectedMic}
          audioDevicesList={audioDevicesList}
          selectedCam={selectedCam}
          handleCamChange={handleCamChange}
          videoDevicesList={videoDevicesList}
          selectedPlayback={selectedPlayback}
          handlePlaybackDeviceChange={handlePlaybackDeviceChange}
          playbackDevicesList={playbackDevicesList}
          joinMeeting={joinMeeting}
          isPlaying={isPlaying}
          audioProgress={audioProgress}
          testSpeakers={testSpeakers}
          interviewData={interviewData}
          handleMicChange={handleMicChange}
          cameraPermission={cameraPermission}
          microphonePermission={microphonePermission}
          setInterviewData={setInterviewData}
          interviewType={interviewType}
          isSafari={isSafari}
        />
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
export default MeetingView;
