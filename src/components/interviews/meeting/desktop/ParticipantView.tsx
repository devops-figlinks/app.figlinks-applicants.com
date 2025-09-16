import CamDevices from "@/components/core/meeting/CamDevices";
import MicAndSpeakerDevices from "@/components/core/meeting/MicAndSpeakerDevices";
import StreamVideoPlayer from "@/components/core/meeting/StreamVideoPlayer";
import { stringAvatar } from "@/helpers/muiAvatar";
import useParticipantHook from "@/lib/hooks/meeting/useParticipantHook";
import {
  IuseParticipantHookReturnType,
  IUseQuestionHookReturnType,
  ParticipantViewProps,
} from "@/lib/interfaces/meeting";
import { Avatar } from "@/components/ui/avatar";
import AudioVisualizersInMeeting from "./AudioVisualizersInMeeting";
import BottomActionBarInMeeting from "./BottomActionBarInMeeting";
import useQuestionsHook from "@/lib/hooks/meeting/useQuestionsHooks";

function ParticipantView(props: ParticipantViewProps) {
  const {
    participantId,
    audioDevicesList,
    videoDevicesList,
    playbackDevicesList,
    botSpeechDuration,
    interviewData,
    cameraPermission,
    microphonePermission,
    setInterviewData,
    questions,
    questionNo,
    submitError,
    setSubmitError,
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
    webcamStream,
    micStream,
  }: IuseParticipantHookReturnType = useParticipantHook(props);

 
  return (
    <div key={participantId} className="h-full w-full">
      {webcamOn ? (
        <StreamVideoPlayer
          videoStream={videoStream as MediaStream | string}
          height={"100%"}
          width={"100%"}
        />
      ) : (
        <div className="flex justify-center items-center h-[200px] w-[300px]">
          <Avatar {...stringAvatar(participantName as string)} />
        </div>
      )}

      <AudioVisualizersInMeeting
        isActiveSpeaker={isActiveSpeaker}
        botSpeechRendered={botSpeechRendered}
        botSpeechDuration={botSpeechDuration}
        micOn={micOn}
        rendered={rendered}
        interviewData={interviewData}
        setInterviewData={setInterviewData}
        isRecording={isRecording}
      />
      <BottomActionBarInMeeting
        submitError={submitError}
        questions={questions}
        questionNo={questionNo}
        micOn={micOn}
        webcamOn={webcamOn}
        toggleMic={toggleMic}
        openMicAndSpeakerOptions={openMicAndSpeakerOptions}
        toggleWebcam={toggleWebcam}
        openCameraOptions={openCameraOptions}
        leaveTheMeeting={leaveTheMeeting}
        cameraPermission={cameraPermission}
        microphonePermission={microphonePermission}
        joined={joined}
        isSafari={isSafari}
        isInterviewComplete={interviewData.isInterviewComplete}

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
  );
}

export default ParticipantView;