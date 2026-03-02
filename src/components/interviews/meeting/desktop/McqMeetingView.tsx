import Loading from "@/components/core/Loading";
import useMcqMeetingHook from "@/lib/hooks/meeting/useMcqMeetingHook";
import { IMcqExamBlock, IQuestioningBlock } from "@/lib/interfaces/meeting";
import Image from "next/image";
import McqQuestionsComponent from "../McqQuestionsComponent";
import McqParticipantView from "./McqParticipantView";
import { timerColor } from "@/lib/helpers/timerColors";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { changeFirstCharToUpper } from "@/lib/helpers/changeFirstCharToUpper";
import { getColorByFirstLetter } from "@/helpers/generateCharColors";

const McqExamScreen = (props: IMcqExamBlock & IQuestioningBlock) => {
  const {
    setSubmitError,
    // participantId,
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
    setIsWebcamOnInMeeting,
    setIsMicOnInMeeting,
    selectedCamInMeet,
    selectedMicInMeet,
    selectedSpeakerInMeet,
    setSelectedCamInMeet,
    setSelectedMicInMeet,
    setSelectedSpeakerInMeet,
    interviewData,
    cameraPermission,
    microphonePermission,
    audioRef,
    setInterviewData,
    questions,
    questionNo,
    counts,
    setCounts,
    capturedImages,
    setCapturedImages,
    submitError,
    detectionCounts,
    isInterviewComplete,
    isRecording,
    participants,
    setInterviewTimes,
    interviewType,
    setInterviewType,
    videoStreamOff,
    setVideoStreamOff,
    isSafari,
    captureStartScreenshotRef,
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
  const date = new Date(interviewData?.start_date);
  const formattedDate = date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/\s+/g, "-");

  return (
    <div className="p-4 bg-white rounded-lg">
      <p className="bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] bg-clip-text text-transparent font-medium text-xl 3xl:!text-2xl leading-[115%] capitalize mb-4">
        {interviewData?.title}
      </p>
      <div className="grid grid-cols-[70%_30%] gap-4">
        <Card className="rounded-2xl border border-[#f2f2f2] bg-white">
          <CardContent className="p-0">
            <div className="flex justify-between items-center bg-[#f2f2f2] rounded-t-2xl p-2">
              <div>
                {currentStage === "questions" ? (
                  <div>
                    {remainingTime > 0 && (
                      <div
                        className={`flex items-center gap-1 text-xl 3xl:!text-2xl font-normal"
                            ${
                              remainingTime < 10
                                ? "text-[#ff6347]"
                                : "text-black"
                            }`}
                      >
                        <Image
                          src="/interviews/clock-icon.svg"
                          alt="Timer"
                          width={18}
                          height={18}
                        />
                        <span
                          style={{
                            fontSize: "13px",
                            color: timerColor(remainingTime),
                          }}
                        >
                          {getMinAndSecsFromSecs(remainingTime)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="text-[#f2f2f2]">.</span>
                  </div>
                )}
              </div>
              {currentStage === "questions" && (
                <p className="text-base 3xl:!text-lg font-medium text-black capitalize">
                  {questionNo + 1}/{questions.length}
                </p>
              )}
            </div>
            <div className="min-h-[calc(100vh-250px)]">
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
            </div>
            <div className="flex items-center justify-end bg-[#ffffff33] border-t border-[#f2f2f2] rounded-b-2xl py-2 px-4 shadow-[0.96px_-0.96px_6.72px_0px_rgba(255,255,255,0.1)_inset,0px_0.853px_20.483px_-0.853px_rgba(0,0,0,0.18)] backdrop-blur-[24.48px]">
              {currentStage !== "conclusion" && (
                <Button
                  onClick={
                    currentStage === "questions" &&
                    questionNo === questions.length - 1
                      ? handleSubmit
                      : currentStage === "intro"
                        ? handleNext
                        : handleNext
                  }
                  className="flex items-center cursor-pointer bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] text-white font-medium text-sm 3xl:!text-base capitalize px-4 py-2 rounded-md"
                >
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
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col border-none shadow-none">
          <CardContent className="p-0 flex flex-col gap-2 justify-start">
            <div className="flex flex-wrap gap-2.5 w-full h-[calc(100vh-500px)] bg-[#121212] p-0 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] overflow-hidden">
              {[...participants.keys()].map((participantId) => (
                <McqParticipantView
                  participantId={participantId}
                  setSubmitError={setSubmitError}
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
                  videoStreamOff={videoStreamOff}
                  setVideoStreamOff={setVideoStreamOff}
                  isSafari={isSafari}
                  captureStartScreenshotRef={captureStartScreenshotRef}

                />
              ))}
            </div>
            <div className=" rounded-2xl bg-white shadow-[0_0_9px_0px_rgba(0,0,0,0.14)] p-4 w-full box-border mt-2 flex flex-col gap-2">
              <p className="bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] bg-clip-text text-transparent font-medium text-xl 3xl:!text-2xl leading-[115%] capitalize mb-0">
                {interviewData?.title}
              </p>
              {interviewData?.tags && interviewData?.tags?.length > 0 && (
                <div className=" flex items-center gap-2">
                  <p className="text-sm 3xl:!text-base font-normal text-black">
                    Tags:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interviewData?.tags?.map((tag: string, index: number) => (
                      <div
                        className="text-xs 3xl:!text-sm px-2 py-1 gap-2 rounded-md max-w-[120px] h-[24px] inline-flex items-start justify-center"
                        key={index}
                        style={getColorByFirstLetter(tag)}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[85px] cursor-default">
                                {changeFirstCharToUpper(tag)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs bg-white border border-gray-200 rounded-none text-black/80">
                              {changeFirstCharToUpper(tag)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm 3xl:!text-base font-normal text-black">
                Posted On: {formattedDate ? formattedDate : " "}
              </p>
            </div>
          </CardContent>
        </Card>
        <Loading
          loading={submittingInterview}
          label={
            "Submitting Interview, please wait...!\nDon't refresh the page"
          }
        />
      </div>
    </div>
  );
};

export default McqExamScreen;
