import CamDevices from "@/components/core/meeting/CamDevices";
import MicAndSpeakerDevices from "@/components/core/meeting/MicAndSpeakerDevices";
import StreamVideoPlayer from "@/components/core/meeting/StreamVideoPlayer";
import { stringAvatar } from "@/helpers/muiAvatar";
import useParticipantHook from "@/lib/hooks/meeting/useParticipantHook";
import useQuestionsHook from "@/lib/hooks/meeting/useQuestionsHooks";
import {
  IQuestioningBlock,
  IUseQuestionHookReturnType,
  IuseParticipantHookReturnType,
  ParticipantViewProps,
} from "@/lib/interfaces/meeting";
import { Avatar } from "@mui/material";
import Image from "next/image";
import { TypeAnimation } from "react-type-animation";
import MobileAudioVisualizersInMeeting from "./MobileAudioVisualizersInMeeting";
import MobileBottomActionBarInMeeting from "./MobileBottomActionBarInMeeting";
import RedirectingDialog from "../desktop/RedirectingDialog";
import Loading from "@/components/core/Loading";
import { timerColor } from "@/lib/helpers/timerColors";
const MobileParticipantView = (
  props: ParticipantViewProps & IQuestioningBlock
) => {
  const {
    participantId,
    audioDevicesList,
    videoDevicesList,
    playbackDevicesList,
    botSpeechDuration,
    isInterviewComplete,
    interviewData,
    isInterviewStarted,
    questionNo,
    questions,
    cameraPermission,
    microphonePermission,
    startTheNextQuestion,
    setInterviewData,
    detectionCounts,
    joined,
    isRecording,
    isSafari,
  } = props;

  const {
    webcamOn,
    videoStream,
    participantName,
    isActiveSpeaker,
    botSpeechRendered,
    micOn,
    rendered,
    micAnchorEL,
    selectedMicInMeet,
    selectedSpeakerInMeet,
    cameraAnchorEL,
    selectedCamInMeet,
    toggleMic,
    openMicAndSpeakerOptions,
    toggleWebcam,
    openCameraOptions,
    leaveTheMeeting,
    setMicAnchorEl,
    onChanceMicInMeeting,
    onChangeSpeakerInMeeting,
    setCameraAnchorEl,
    onChangeWebCamInMeeting,
  }: IuseParticipantHookReturnType = useParticipantHook(props);

  const {
    renderTypeWriter,
    isRedirecting,
    showNextButtonOrNot,
    submittingInterview,
    submitInterviewForTesting,
    submitError,
    remainingTime,
    timer1,
    isIosInterview,

    onIOSPlayClick,
    audioDataRef,

    isTimerCompleted,
    handleManualNextQuestion,

  }: IUseQuestionHookReturnType = useQuestionsHook(props);

  const getMinAndSecsFromSecs = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className=" bg-[#2d2d2d] flex flex-col  justify-between gap-4 p-4 h-[50vh] overflow-y-auto scrollbar-none relative">
        <div>
          {renderTypeWriter ? (
            <TypeAnimation
              className="whitespace-pre-line block text-white md:text-black text-base font-normal leading-[140%]"
              sequence={
                isInterviewComplete
                  ? [interviewData.conclude_dailog?.replaceAll("...", "")]
                  : !isInterviewStarted
                    ? [interviewData.intro_dailog?.replaceAll("...", "")]
                    : [`${questionNo + 1}. ${questions[questionNo]?.qtn}`]
              }
              speed={50}
              repeat={1}
            />
          ) : (
            ""
          )}
        </div>
        <div className="text-center">
          <MobileAudioVisualizersInMeeting
            isActiveSpeaker={isActiveSpeaker}
            micOn={micOn}
            botSpeechRendered={botSpeechRendered}
            botSpeechDuration={botSpeechDuration}
            rendered={rendered}
            interviewData={interviewData}
            setInterviewData={setInterviewData}
          />
        </div>
      </div>
      <div className="relative h-[50vh] bg-[#00000080]">
        {isRecording ? (
          <div className="absolute top-2 left-2 bg-white flex items-center gap-1 p-[2px_5px] rounded-[1px] z-10">
            <Image alt="" src="/rec-dot.gif" width={15} height={15} />
            <p className=" text-gray-900 text-[11px] font-normal leading-none m-0">
              REC
            </p>
          </div>
        ) : ""}
        {remainingTime > 0 && isRecording && timer1 && (
          <div className={`absolute top-2 right-2 flex items-center gap-1 text-xs 3xl:!text-sm font-medium leading-none capitalize m-0 bg-white p-1 w-fit rounded z-10 ${remainingTime < 10 ? 'text-[#ff6347]' : 'text-black'}`}>
            <Image src="/interviews/timer-icon2.svg" alt="timepicker" width={14} height={14} />
            <span style={{ fontSize: "13px", color: timerColor(remainingTime) }}>
              {getMinAndSecsFromSecs(remainingTime)} secs
            </span>
          </div>
        )}
        {videoStream ? (
          <StreamVideoPlayer
            videoStream={videoStream}
            height="100%"
            width="100%"
            selectedCam={selectedCamInMeet}
            videoDevicesList={videoDevicesList}
          />
        ) : (
          <div className="h-full w-full flex justify-center items-center">
            <Avatar {...stringAvatar(participantName as string)} />
          </div>
        )}

        <MobileBottomActionBarInMeeting
          submitError={submitError}
          questions={questions}
          questionNo={questionNo}
          submitInterviewForTesting={submitInterviewForTesting}
          micOn={micOn}
          webcamOn={webcamOn}
          toggleMic={toggleMic}
          openMicAndSpeakerOptions={openMicAndSpeakerOptions}
          toggleWebcam={toggleWebcam}
          openCameraOptions={openCameraOptions}
          leaveTheMeeting={leaveTheMeeting}
          cameraPermission={cameraPermission}
          microphonePermission={microphonePermission}
          startTheNextQuestion={startTheNextQuestion}
          showNextButtonOrNot={showNextButtonOrNot}
          joined={joined}
          isInterviewComplete={isInterviewComplete}
          isSafari={isSafari}
          isIosInterview={isIosInterview}
          audioDataRef={audioDataRef}
          onIOSPlayClick={onIOSPlayClick}
          isTimerCompleted={isTimerCompleted}
          handleManualNextQuestion={handleManualNextQuestion}
        />
        <MicAndSpeakerDevices
          micAnchorEL={micAnchorEL}
          selectedMicInMeet={selectedMicInMeet}
          selectedSpeakerInMeet={selectedSpeakerInMeet}
          playbackDevicesList={playbackDevicesList}
          audioDevicesList={audioDevicesList}
          setMicAnchorEl={setMicAnchorEl}
          onChanceMicInMeeting={onChanceMicInMeeting}
          onChangeSpeakerInMeeting={onChangeSpeakerInMeeting}
        />
        <CamDevices
          cameraAnchorEL={cameraAnchorEL}
          selectedCamInMeet={selectedCamInMeet}
          videoDevicesList={videoDevicesList}
          setCameraAnchorEl={setCameraAnchorEl}
          onChangeWebCamInMeeting={onChangeWebCamInMeeting}
        />
      </div>

      <RedirectingDialog openOrNot={isRedirecting} />
      <Loading
        loading={submittingInterview}
        label="Submitting Interview..."
      />
    </div>
  );
};

export default MobileParticipantView;
