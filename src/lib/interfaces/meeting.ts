import {
  CameraDeviceInfo,
  MicrophoneDeviceInfo,
} from "@videosdk.live/react-sdk";
import {
  DeviceInfo,
  PlaybackDeviceInfo,
} from "@videosdk.live/react-sdk/dist/types/deviceInfo";
import { Participant } from "@videosdk.live/react-sdk/dist/types/participant";
import { Permission } from "@videosdk.live/react-sdk/dist/types/permission";
import { Dispatch, MouseEvent, MutableRefObject, SetStateAction } from "react";
import { IWebHookData } from "./candidates";

export interface IPermissions {
  checkPermissions: (
    permissions?: Permission | undefined | any
  ) => Promise<Map<string, boolean>>;
  requestPermission: (
    permissions?: Permission | undefined | any
  ) => Promise<Map<string, boolean>>;
  getCameras: () => Promise<CameraDeviceInfo[]>;
  getMicrophones: () => Promise<MicrophoneDeviceInfo[]>;
  getPlaybackDevices: () => Promise<PlaybackDeviceInfo[]>;
}

export interface IUseMeeting {
  join: () => void;
  participants: Map<string, any> | Map<string, Participant> | any;
  changeMic: (object: string | MediaStream) => void;
  changeWebcam: (object: string | MediaStream) => void;
  getMics: () => Promise<
    Array<{
      deviceId: string;
      label: string;
    }>
  >;
  toggleWebcam: (customVideoTrack?: MediaStream | undefined) => void;
  toggleMic: (customAudioTrack?: MediaStream | undefined) => void;
  startRecording: (
    webhookUrl?: string,
    awsDirPath?: string,
    config?: {
      layout: {
        type: "GRID" | "SPOTLIGHT" | "SIDEBAR";
        priority: "SPEAKER" | "PIN";
        gridSize: number;
      };
      orientation: "landscape" | "portrait";
      theme: "DEFAULT" | "DARK" | "LIGHT";
      quality: "low" | "med" | "high";
      mode: "video-and-audio" | "audio";
    }
  ) => void;
  isRecording: boolean;
}

export interface IUseMeetingHook {
  meetingId: string;
  onMeetingLeave: (setJoined: Dispatch<SetStateAction<string | null>>) => void;
  setMicOnOrNot: Dispatch<SetStateAction<boolean>>;
  setCamOnOrNot: Dispatch<SetStateAction<boolean>>;
  interviewData: any;
  questions: IQuesObj[];
  setQuestions: Dispatch<SetStateAction<IQuesObj[]>>;
  videoSDKToken: string;
  webHookObj: IWebHookData;
}
export interface IUseQuestionsHook {
  // setAudioBlobForNextQuestion: Dispatch<SetStateAction<Blob | undefined>>;
  interviewData: any;
  isInterviewStarted: boolean;
  // audioBlobForNextQuestion: Blob | null;
  questions: IQuesObj[];
  questionNo: number;
  setBotSpeechDuration: Dispatch<SetStateAction<number>>;
  setQuestionDuration: Dispatch<SetStateAction<number>>;
  setQuestions: Dispatch<SetStateAction<IQuesObj[]>>;
  setBotSpeechRendered: Dispatch<SetStateAction<boolean>>;
  setIsInterviewStarted: Dispatch<SetStateAction<boolean>>;
  setIsInterviewCompleted: Dispatch<SetStateAction<boolean>>;
}

export interface iLogCounts {
  leaveCount: number;
  video: number;
  audio: number;

  timeIntervals: {
    awayTime: number;
    inTime: number | null;
  }[];
  videoTimeIntervals: {
    awayTime: number;
    inTime: number | null;
  }[];
  audioTimeIntervals: {
    awayTime: number;
    inTime: number | null;
  }[];
  // totalTimeDiff: number;
  // totalDuration: number;
}

export interface iFaces {
  fileName: string;
  base64: string | null;
}

export interface IDetectionCounts {
  eye_left_count: number;
  eye_right_count: number;
  eye_up_count: number;
  eye_down_count: number;

  eye_left_time: number;
  eye_right_time: number;
  eye_up_time: number;
  eye_down_time: number;

  multiple_face_detected: boolean;
  multiple_face_detected_count: number;

  eyeTimeIntervals: {
    left: Array<{ awayTime: number; inTime: number | null }>;
    right: Array<{ awayTime: number; inTime: number | null }>;
    up: Array<{ awayTime: number; inTime: number | null }>;
    down: Array<{ awayTime: number; inTime: number | null }>;
  };
}

export type QuestionAnswer = {
  qns: string;
  c_answer: string;
  options: string[];
};

// Define the InterviewTimes type
export type InterviewTimes = {
  firstQuestionTime: Date | null;
  lastQuestionTime: Date | null;
};
export interface IUseMeetingHookReturnType {
  submitError: boolean;
  detectionCounts: any;
  setSubmitError: Dispatch<SetStateAction<boolean>>;
  isRecording: boolean;
  timer: number;
  joined: string | null;
  participants: Map<string, any> | Map<string, Participant> | any;
  audioStream: MediaStream | string;
  audioDevicesList: DeviceInfo[];
  videoDevicesList: DeviceInfo[];
  playbackDevicesList: DeviceInfo[];
  selectedCam: string;
  selectedMic: string;
  selectedPlayback: string;
  counts: iLogCounts;
  setCounts: Dispatch<SetStateAction<iLogCounts>>;
  capturedImages: iFaces[];
  setCapturedImages: Dispatch<SetStateAction<iFaces[]>>;
  questionNo: number;
  botSpeechDuration: number;
  isInterviewComplete: boolean;
  videoStream: MediaStream | string;
  isPlaying: boolean;
  audioProgress: number;
  participantCount: number;
  loading: boolean;
  isSettingUpInterview: boolean;
  questionDuration: number;
  isIntroduction: boolean;
  isInterviewStarted: boolean;
  botSpeechRendered: boolean;

  // audioBlobForNextQuestion: Blob | null;
  // isGettingInterviewDetails: boolean;
  isMicOnInMeeting: boolean;
  isWebcamOnInMeeting: boolean;
  selectedCamInMeet: string;
  selectedMicInMeet: string;
  selectedSpeakerInMeet: string;
  cameraPermission: PermissionState;
  microphonePermission: PermissionState;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setTimer: Dispatch<SetStateAction<number>>;
  startRec: () => void;
  setSelectedCamInMeet: Dispatch<SetStateAction<string>>;
  setSelectedMicInMeet: Dispatch<SetStateAction<string>>;
  setSelectedSpeakerInMeet: Dispatch<SetStateAction<string>>;
  setIsWebcamOnInMeeting: Dispatch<SetStateAction<boolean>>;
  setIsMicOnInMeeting: Dispatch<SetStateAction<boolean>>;
  // setAudioBlobForNextQuestion: Dispatch<SetStateAction<Blob | null>>;
  setBotSpeechRendered: Dispatch<SetStateAction<boolean>>;
  setIsInterviewStarted: Dispatch<SetStateAction<boolean>>;
  setIsIntroduction: Dispatch<SetStateAction<boolean>>;
  setQuestionDuration: Dispatch<SetStateAction<number>>;
  setSelectedCam: Dispatch<SetStateAction<string>>;
  setJoined: Dispatch<SetStateAction<string | null>>;
  changeMicForTimer: (value: boolean) => void;
  setBotSpeechDuration: Dispatch<SetStateAction<number>>;
  setIsInterviewCompleted: Dispatch<SetStateAction<boolean>>;
  onMicTrigger: () => void;
  onCamTrigger: () => void;
  setSelectedMic: Dispatch<SetStateAction<string>>;
  onChangeMic: (deviceId: string) => void;
  // handlePlaybackDeviceChange: (e: SelectChangeEvent<string>) => void;
  // handleMicChange: (e: SelectChangeEvent<string>) => void;
  // handleCamChange: (e: SelectChangeEvent<string>) => void;

  handlePlaybackDeviceChange: (deviceId: string) => void;
  handleMicChange: (deviceId: string) => void;
  handleCamChange: (deviceId: string) => void;
  testSpeakers: () => void;
  joinMeeting: () => void;
  setIsSettingUpInterview: Dispatch<SetStateAction<boolean>>;
  startTheNextQuestion: () => void;
  endCall: boolean;
  setEndCall: Dispatch<SetStateAction<boolean>>;
  interviewType: string;
  setInterviewType: Dispatch<SetStateAction<string>>;
  questionAnswers: QuestionAnswer[];
  interviewTimes: InterviewTimes;
  setQuestionAnswers: React.Dispatch<React.SetStateAction<QuestionAnswer[]>>;
  setInterviewTimes: React.Dispatch<React.SetStateAction<InterviewTimes>>;
  currentStage: string;
  setCurrentStage: Dispatch<
    SetStateAction<"questions" | "conclusion" | "intro">
  >;
  videoStreamOff: boolean;
  setVideoStreamOff: Dispatch<SetStateAction<boolean>>;
  isSafari: boolean;
}

export interface IQuesObj {
  time_limit: number;
  qtn: string;
  qtn_ans: string;
  qtn_audio: string;
  qtn_audio_url: string;
  id: string;
  audio: Blob;
  duration: number;
  order: number;
  options?: string[];
  ans?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | null;
}

export interface IDropDownForDevices {
  selectedDevice: string;
  //   setSelectedDevice: Dispatch<SetStateAction<string>>;
  mediaDevicesList: DeviceInfo[];
  iconSrc: string;
  isPlaying?: boolean;
  audioProgress?: number;
  testSpeakers?: () => void;
  id?: string;
  onChangeDevice: (value: string) => void;
}

export interface ParticipantViewProps {
  // sendDetectionData: Dispatch<SetStateAction<any>>;
  submitError: boolean;
  detectionCounts: any;
  participants?: Map<string, any> | Map<string, Participant> | any;
  setSubmitError: Dispatch<SetStateAction<boolean>>;
  questions: IQuesObj[];
  questionNo: number;
  participantId: string;
  audioDevicesList: DeviceInfo[];
  videoDevicesList: DeviceInfo[];
  playbackDevicesList: DeviceInfo[];
  selectedCam: string;
  joined: string;
  selectedMic: string;
  selectedPlayback: string;
  meetingId: string;
  botSpeechDuration: number;
  questionDuration: number;
  isInterviewStarted: boolean;
  botSpeechRendered: boolean;
  selectedCamInMeet: string;
  selectedMicInMeet: string;
  selectedSpeakerInMeet: string;
  interviewData: any;
  cameraPermission: PermissionState;
  microphonePermission: PermissionState;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setSelectedCamInMeet: Dispatch<SetStateAction<string>>;
  setSelectedMicInMeet: Dispatch<SetStateAction<string>>;
  setSelectedSpeakerInMeet: Dispatch<SetStateAction<string>>;
  setIsWebcamOnInMeeting: Dispatch<SetStateAction<boolean>>;
  setIsMicOnInMeeting: Dispatch<SetStateAction<boolean>>;
  setBotSpeechRendered: Dispatch<SetStateAction<boolean>>;
  setQuestionDuration: Dispatch<SetStateAction<number>>;
  setJoined: Dispatch<SetStateAction<string | null>>;
  changeMicForTimer: (value: boolean) => void;
  setBotSpeechDuration: Dispatch<SetStateAction<number>>;
  setInterviewData: Dispatch<SetStateAction<any>>;
  counts: iLogCounts;
  setCounts: Dispatch<SetStateAction<iLogCounts>>;
  capturedImages: iFaces[];
  setCapturedImages: Dispatch<SetStateAction<iFaces[]>>;
  isInterviewComplete: boolean;
  isRecording?: boolean;
  endCall?: boolean;
  setEndCall?: Dispatch<SetStateAction<boolean>>;
  interviewType?: string;
  setInterviewType?: Dispatch<SetStateAction<string>>;
  currentStage: string;
  videoStreamOff: boolean;
  setVideoStreamOff: Dispatch<SetStateAction<boolean>>;
  isSafari: boolean;
}
export interface McqParticipantViewProps {
  participantId: string;
}
export interface SelectedMessage {
  id: string;
  qtn: string;
  ans: string;
  time_limit?: string;
  options?: any[];
}
export interface SelectedMessages {
  id: string;
  qtn: string;
  ans: string;
  time_limit?: string;
  que_audio: string;
}
export type ChatbotQuestionsScreenType = {
  className?: string;
  selectedMessages?: SelectedMessage[];
};

export interface Option {
  id: string;
  text: string;
  editing?: boolean;
}
export interface MCQImportRow {
  Questions: string;
  Answer: string;
  [key: string]: string | undefined;
}
export interface IPrecallScreen {
  camOnOrNot: boolean;
  micOnOrNot: boolean;
  videoStream: MediaStream | string;
  participantName: string;
  audioStream: MediaStream | string;
  selectedMic: string;
  audioDevicesList: DeviceInfo[];
  selectedCam: string;
  videoDevicesList: DeviceInfo[];
  selectedPlayback: string;
  playbackDevicesList: DeviceInfo[];
  isPlaying: boolean;
  audioProgress: number;
  handlePlaybackDeviceChange: (value: string) => void;
  handleCamChange: (value: string) => void;
  handleMicChange: (value: string) => void;
  onMicTrigger: () => void;
  onCamTrigger: () => void;

  joinMeeting: () => void;
  testSpeakers: () => void;

  setInterviewData: Dispatch<SetStateAction<any>>;
  interviewData: any;
  cameraPermission: PermissionState;
  microphonePermission: PermissionState;
  interviewType: string;
  isSafari: boolean;
}

export interface ICameraDropDownInMeeting {
  cameraAnchorEL: HTMLElement | null;
  videoDevicesList: DeviceInfo[];
  selectedCamInMeet: string;
  onChangeWebCamInMeeting: (camId: string) => void;
  setCameraAnchorEl: Dispatch<SetStateAction<HTMLElement | null>>;
}

export interface IMicAndSpeakerDevices {
  micAnchorEL: HTMLElement | null;
  audioDevicesList: DeviceInfo[];
  selectedMicInMeet: string;
  playbackDevicesList: DeviceInfo[];
  selectedSpeakerInMeet: string;
  setMicAnchorEl: Dispatch<SetStateAction<HTMLElement | null>>;
  onChanceMicInMeeting: (micId: string) => void;
  onChangeSpeakerInMeeting: (speakerId: string) => void;
}

export interface IMobileBottomActionBarInMeeting {
  submitError: boolean;
  questions: any[];
  questionNo: number;
  submitInterviewForTesting?: () => void;
  toggleMic: () => void;
  micOn: boolean;
  cameraPermission: PermissionState;
  microphonePermission: PermissionState;
  openMicAndSpeakerOptions: (event: MouseEvent<HTMLDivElement>) => void;
  toggleWebcam: () => void;
  webcamOn: boolean;
  openCameraOptions: (event: MouseEvent<HTMLDivElement>) => void;
  leaveTheMeeting: () => void;
  startTheNextQuestion?: () => void;
  showNextButtonOrNot?: boolean;
  joined: string;
  isSafari: boolean;
  isInterviewComplete: boolean;
  onIOSPlayClick: OnIOSPlayClickType;
  audioDataRef?: MutableRefObject<any>;
  isIosInterview: boolean;
  isTimerCompleted?: boolean;
  handleManualNextQuestion?: () => void;
  interviewType?: string;
}

export interface IBottomActionBarInMeeting {
  submitError: boolean;
  questions: any[];
  questionNo: number;
  submitInterviewForTesting?: () => void;
  toggleMic: () => void;
  micOn: boolean;
  cameraPermission: PermissionState;
  microphonePermission: PermissionState;
  openMicAndSpeakerOptions: (event: MouseEvent<HTMLDivElement>) => void;
  toggleWebcam: () => void;
  webcamOn: boolean;
  openCameraOptions: (event: MouseEvent<HTMLDivElement>) => void;
  leaveTheMeeting: () => void;
  startTheNextQuestion?: () => void;
  showNextButtonOrNot?: boolean;
  joined: string;
  isSafari: boolean;
  isInterviewComplete: boolean;
}

export interface IAudioVisualizersInMeeting {
  isActiveSpeaker: boolean;
  micOn: boolean;
  botSpeechRendered: boolean;
  botSpeechDuration: number;
  rendered: boolean;
  interviewData: any;
  setInterviewData: Dispatch<SetStateAction<any>>;
  // faceDetectionDone: boolean;
  isRecording?: boolean;
}

export interface IuseParticipantHookReturnType {
  webcamOn: boolean;
  micStream: MediaStream | any;
  videoStream: MediaStream | string;
  participantName: string;
  isActiveSpeaker: boolean;
  botSpeechRendered: boolean;
  webcamStream: MediaStream | any;
  micOn: boolean;
  rendered: boolean;
  micAnchorEL: HTMLElement | null;
  selectedMicInMeet: string;
  selectedSpeakerInMeet: string;
  cameraAnchorEL: HTMLElement | null;
  selectedCamInMeet: string;
  toggleMic: () => void;
  openMicAndSpeakerOptions: (event: MouseEvent<HTMLDivElement>) => void;
  toggleWebcam: () => void;
  openCameraOptions: (event: MouseEvent<HTMLDivElement>) => void;
  leaveTheMeeting: () => void;
  setMicAnchorEl: Dispatch<SetStateAction<HTMLElement | null>>;
  onChanceMicInMeeting: (micId: string) => void;
  onChangeSpeakerInMeeting: (speakerId: string) => void;
  setCameraAnchorEl: Dispatch<SetStateAction<HTMLElement | null>>;
  onChangeWebCamInMeeting: (camId: string) => void;
}

export interface IRedirectingDialog {
  openOrNot: boolean;
}
export type OnIOSPlayClickType = (
  audio: HTMLAudioElement | null | undefined,
  event?: Event | MouseEvent
) => void;

export interface IUseQuestionHookReturnType {
  renderTypeWriter: boolean;
  isRedirecting: boolean;
  showNextButtonOrNot: boolean;
  submittingInterview: boolean;
  submitInterviewForTesting: () => void;
  submitError: boolean;
  detectionCounts: any;
  timer1: boolean;
  remainingTime: number;
  setCountQuestion: Dispatch<SetStateAction<number>>;
  playAudioFromQuestions: () => void;
  countdownRef?: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setTimer1: Dispatch<SetStateAction<boolean>>;
  audioDataRef?: MutableRefObject<any>;
  isIosInterview: boolean;
  onIOSPlayClick: OnIOSPlayClickType;
  isTimerCompleted: boolean;
  handleManualNextQuestion: () => void;
  botMediaRecorder: MediaRecorder | null;
  botAudioChunks: Blob[];
  
}

export interface IQuestioningBlock {
  submitError: boolean;
  setSubmitError: Dispatch<SetStateAction<boolean>>;
  meetingId: string;
  videoSDKToken: string;
  questionNo: number;
  isInterviewComplete: boolean;
  questions: IQuesObj[];
  isSettingUpInterview: boolean;
  isIntroduction: boolean;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  startRec: () => void;
  setIsInterviewCompleted: Dispatch<SetStateAction<boolean>>;
  setQuestions: Dispatch<SetStateAction<IQuesObj[]>>;
  setBotSpeechDuration: Dispatch<SetStateAction<number>>;
  setIsSettingUpInterview: Dispatch<SetStateAction<boolean>>;
  setQuestionDuration: Dispatch<SetStateAction<number>>;
  setIsIntroduction: Dispatch<SetStateAction<boolean>>;
  // audioBlobForNextQuestion: Blob | null;
  // setAudioBlobForNextQuestion: Dispatch<SetStateAction<Blob | null>>;
  interviewData: any;
  isInterviewStarted: boolean;
  setIsInterviewStarted: Dispatch<SetStateAction<boolean>>;
  botSpeechRendered: boolean;
  setBotSpeechRendered: Dispatch<SetStateAction<boolean>>;
  isMicOnInMeeting: boolean;
  isWebcamOnInMeeting: boolean;
  selectedSpeakerInMeet: string;
  startTheNextQuestion: () => void;
  setTimer: Dispatch<SetStateAction<number>>;
  isRecording: boolean;
  counts: iLogCounts;
  setCounts: Dispatch<SetStateAction<iLogCounts>>;
  capturedImages: iFaces[];
  setCapturedImages: Dispatch<SetStateAction<iFaces[]>>;
  detectionCounts: any;
  endCall?: boolean;
  setEndCall?: Dispatch<SetStateAction<boolean>>;
  interviewType?: string;
  setInterviewType?: Dispatch<SetStateAction<string>>;
  questionAnswers?: QuestionAnswer[];
  interviewTimes?: InterviewTimes;
  setQuestionAnswers?: React.Dispatch<React.SetStateAction<QuestionAnswer[]>>;
  setInterviewTimes?: React.Dispatch<React.SetStateAction<InterviewTimes>>;
  currentStage: string;
  setCurrentStage: Dispatch<
    SetStateAction<"questions" | "conclusion" | "intro">
  >;
  joined?: string | null;
  videoStreamOff: boolean;
  setVideoStreamOff: Dispatch<SetStateAction<boolean>>;
}

export interface IMcqExamBlock {
  videoSDKToken: string;
  isSettingUpInterview: boolean;
  isIntroduction: boolean;

  startRec: () => void;
  setIsInterviewCompleted: Dispatch<SetStateAction<boolean>>;
  setQuestions: Dispatch<SetStateAction<IQuesObj[]>>;

  setIsSettingUpInterview: Dispatch<SetStateAction<boolean>>;
  setIsIntroduction: Dispatch<SetStateAction<boolean>>;
  // audioBlobForNextQuestion: Blob | null;
  // setAudioBlobForNextQuestion: Dispatch<SetStateAction<Blob | null>>;

  setIsInterviewStarted: Dispatch<SetStateAction<boolean>>;
  isMicOnInMeeting: boolean;
  isWebcamOnInMeeting: boolean;

  startTheNextQuestion: () => void;
  setTimer: Dispatch<SetStateAction<number>>;

  questionAnswers: QuestionAnswer[];
  interviewTimes: InterviewTimes;
  setQuestionAnswers: React.Dispatch<React.SetStateAction<QuestionAnswer[]>>;
  setInterviewTimes: React.Dispatch<React.SetStateAction<InterviewTimes>>;
  submitError: boolean;

  participants?: Map<string, any> | Map<string, Participant> | any;
  setSubmitError: Dispatch<SetStateAction<boolean>>;
  questions: IQuesObj[];
  questionNo: number;
  participantId: string;
  audioDevicesList: DeviceInfo[];
  videoDevicesList: DeviceInfo[];
  playbackDevicesList: DeviceInfo[];
  selectedCam: string;
  joined: string;
  selectedMic: string;
  selectedPlayback: string;
  meetingId: string;
  botSpeechDuration: number;
  questionDuration: number;
  isInterviewStarted: boolean;
  botSpeechRendered: boolean;
  selectedCamInMeet: string;
  selectedMicInMeet: string;
  selectedSpeakerInMeet: string;
  interviewData: any;
  cameraPermission: PermissionState;
  microphonePermission: PermissionState;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setSelectedCamInMeet: Dispatch<SetStateAction<string>>;
  setSelectedMicInMeet: Dispatch<SetStateAction<string>>;
  setSelectedSpeakerInMeet: Dispatch<SetStateAction<string>>;
  setIsWebcamOnInMeeting: Dispatch<SetStateAction<boolean>>;
  setIsMicOnInMeeting: Dispatch<SetStateAction<boolean>>;
  setBotSpeechRendered: Dispatch<SetStateAction<boolean>>;
  setQuestionDuration: Dispatch<SetStateAction<number>>;
  setJoined: Dispatch<SetStateAction<string | null>>;
  changeMicForTimer: (value: boolean) => void;
  setBotSpeechDuration: Dispatch<SetStateAction<number>>;
  setInterviewData: Dispatch<SetStateAction<any>>;
  counts: iLogCounts;
  setCounts: Dispatch<SetStateAction<iLogCounts>>;
  capturedImages: iFaces[];
  setCapturedImages: Dispatch<SetStateAction<iFaces[]>>;
  isInterviewComplete: boolean;
  isRecording?: boolean;
  interviewType: string;
  setInterviewType: Dispatch<SetStateAction<string>>;
  isSafari: boolean;
}
export interface IMobileExamScreenBlock {
  interviewData: any;
  questions: IQuesObj[];
  questionNo: number;
  setQuestions: Dispatch<SetStateAction<IQuesObj[]>>;
  startTheNextQuestion: () => void;
  interviewTimes: InterviewTimes;
  setQuestionAnswers?: React.Dispatch<React.SetStateAction<QuestionAnswer[]>>;
  setInterviewTimes: React.Dispatch<React.SetStateAction<InterviewTimes>>;
  submittingInterview: boolean;
  submitInterviewForTesting?: () => void;
  timer1: boolean;
  remainingTime: number;
}

export interface IMcqQuestionsBlock {
  currentStage: string;
  interviewData: any;
  questionNo: number;
  questionText: string;
  selectedAnswers: Record<string, string>;
  setInterviewTimes: React.Dispatch<React.SetStateAction<InterviewTimes>>;
  options: string[];
  isOptionSelected: (optionText: string) => boolean;
  handleOptionSelect: (optionText: string) => void;
  questionId: string;
}

export interface IMeetingViewWebAndMobile {
  micOnOrNot: boolean;
  camOnOrNot: boolean;
  onMeetingLeave: (setJoined: Dispatch<SetStateAction<string | null>>) => void;
  meetingId: string;
  participantName?: string;
  setMicOnOrNot: Dispatch<SetStateAction<boolean>>;
  setCamOnOrNot: Dispatch<SetStateAction<boolean>>;
  interviewData: any;
  questions: IQuesObj[];
  setQuestions: Dispatch<SetStateAction<IQuesObj[]>>;
  videoSDKToken: string;
  setInterviewData: Dispatch<SetStateAction<any>>;
  webHookObj: IWebHookData;
}
