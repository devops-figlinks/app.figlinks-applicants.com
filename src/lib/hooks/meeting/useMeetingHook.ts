import {
  getNetworkStats,
  useMediaDevice,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import { Participant } from "@videosdk.live/react-sdk/dist/types/participant";
import { useEffect, useRef, useState } from "react";

import { useInterviewContext } from "@/context/InterviewContext";
import { getAllItems } from "@/helpers/indexedDBQuestions";
import { errPopper } from "@/helpers/popper/errPopper";
import useMediaStream from "@/lib/hooks/useMediaStream";
import {
  iFaces,
  iLogCounts,
  InterviewTimes,
  IPermissions,
  IUseMeeting,
  IUseMeetingHook,
  IUseMeetingHookReturnType,
  QuestionAnswer
} from "@/lib/interfaces/meeting";
import {
  DeviceInfo,
  MicrophoneDeviceInfo,
} from "@videosdk.live/react-sdk/dist/types/deviceInfo";
import { base64ToFile } from "@/lib/helpers/base64ToImage";
let path = "/test_sound.mp3";
const useMeetingHook = ({
  onMeetingLeave,
  meetingId,
  setMicOnOrNot,
  setCamOnOrNot,
  interviewData,
  questions,
  setQuestions,
  videoSDKToken,
  webHookObj,
}: IUseMeetingHook): IUseMeetingHookReturnType => {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };
  const { interviewType, setInterviewType } = useInterviewContext();
  const [selectedCam, setSelectedCam] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [joined, setJoined] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [questionNo, setQuestionNo] = useState(0);
  const [videoStream, setVideoStream] = useState<MediaStream | string>("");
  const [audioStream, setAudioStream] = useState<MediaStream | string>("");
  const [audioDevicesList, setAudioDevicesList] = useState<DeviceInfo[]>([]);
  const [videoDevicesList, setVideoDevicesList] = useState<DeviceInfo[]>([]);
  const [playbackDevicesList, setPlaybackDevicesList] = useState<DeviceInfo[]>(
    []
  );
  const [selectedPlayback, setSelectedPlayback] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isInterviewComplete, setIsInterviewCompleted] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    downloadSpeed: 0,
    uploadSpeed: 0,
  });
  const [endCall, setEndCall] = useState<boolean>(false);
  const [videoStreamOff, setVideoStreamOff] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<'intro' | 'questions' | 'conclusion'>('questions');

  const detectionCounts = useRef({
    eye_left_count: 0,
    eye_right_count: 0,
    eye_up_count: 0,
    eye_down_count: 0,
    multiple_face_detected: false,
    multiple_face_detected_count: 0,
    isLookingAway: false,
    lastDirection: null,
    lastFaceCount: 0,
    no_face_detected: false,
    face_detected: false,
    eyeTimeIntervals: {
      left: [],
      right: [],
      up: [],
      multiFaces: [],
      down: [],
    },
  });



  const [botSpeechDuration, setBotSpeechDuration] = useState(0);
  const [questionDuration, setQuestionDuration] = useState(0);
  const [isMicOn, setIsMicOn] = useState(false);
  const [activeSpeakingParticipant, setActiveSpeakingParticipant] =
    useState("");
  const [isSettingUpInterview, setIsSettingUpInterview] = useState(true);
  const [isIntroduction, setIsIntroduction] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [botSpeechRendered, setBotSpeechRendered] = useState(true);

  const [isWebcamOnInMeeting, setIsWebcamOnInMeeting] = useState(false);
  const [isMicOnInMeeting, setIsMicOnInMeeting] = useState(false);
  const [selectedCamInMeet, setSelectedCamInMeet] = useState<string>("");
  const [selectedMicInMeet, setSelectedMicInMeet] = useState<string>("");
  const [selectedSpeakerInMeet, setSelectedSpeakerInMeet] =
    useState<string>("");
  const [cameraPermission, setCameraPermission] =
    useState<PermissionState>("prompt");
  const [microphonePermission, setMicrophonePermission] =
    useState<PermissionState>("prompt");
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);
  useEffect(() => {

    if (questions && questions.length > 0 && questionAnswers.length === 0) {
      setQuestionAnswers(questions.map(question => ({
        qns: question.qtn,
        c_answer: question.ans || "",
        options: question.options || []
      })));
    }
  }, [questions]);
  const [interviewTimes, setInterviewTimes] = useState<InterviewTimes>({
    firstQuestionTime: null,
    lastQuestionTime: null
  });


  const [counts, setCounts] = useState<iLogCounts>({
    video: 0,
    videoTimeIntervals: [],
    audio: 0,
    audioTimeIntervals: [],
    leaveCount: 0,
    timeIntervals: [],

  });

  const [capturedImages, setCapturedImages] = useState<iFaces[]>([]);

  const [submitError, setSubmitError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { getAudioTrack, getVideoTrack } = useMediaStream();

  const {
    requestPermission,
    getCameras,
    getMicrophones,
    getPlaybackDevices,
  }: IPermissions = useMediaDevice({ onDeviceChanged });

  const onMeetingJoined = () => {
    setIsIntroduction(true);
    setJoined("JOINED");
    setIsSettingUpInterview(false);
  };
  const onMeetingLeft = () => {
    setJoined(null);
    onMeetingLeave(setJoined);
  };
  const {
    join,
    participants,
    changeMic,
    getMics,
    toggleWebcam,
    toggleMic,
    startRecording,
    isRecording,
  }: IUseMeeting = useMeeting({
    onMeetingJoined,
    onMeetingLeft,
    onSpeakerChanged,
  });
  const awsDirPath = `meetings/${meetingId}`;
  const startRec = () => {
    const config: {
      layout: {
        type: "GRID" | "SPOTLIGHT" | "SIDEBAR";
        priority: "SPEAKER" | "PIN";
        gridSize: number;
      };
      orientation: "landscape" | "portrait";
      theme: "DEFAULT" | "DARK" | "LIGHT";
      quality: "low" | "med" | "high";
      mode: "video-and-audio" | "audio";
    } = {
      layout: {
        type: "GRID",
        priority: "SPEAKER",
        gridSize: 1,
      },
      orientation: "landscape",
      theme: "DEFAULT",
      quality: "med",
      mode: "video-and-audio",
    };
    if (!isRecording) {
      startRecording(webHookObj.endPoint, awsDirPath, config);
    }

  };

  function onDeviceChanged() {
    checkMediaPermission();
  }

  const changeMicForTimer = (value: boolean) => {
    setTimer(1);
    setIsMicOn(value);
  };
  const getIsMicOn = (): boolean => {
    return isMicOn;
  };

  const onSpeakingPartipantChange = () => {
    const micOnOrNot = getIsMicOn();

    if (micOnOrNot) {
      if (activeSpeakingParticipant) {
        setTimer(0);
      } else {
        setTimer(1);
      }
    }
  };

  function onSpeakerChanged(activeSpeakerId: string | null) {
    if (isInterviewComplete && !isInterviewStarted) {
      return;
    }
    setActiveSpeakingParticipant(activeSpeakerId || "");
  }

  const updateAsPerQuestions = async () => {
    if (interviewData && !Object.keys(interviewData).length) {
      return;
    }
    const interviewQuestions = await getAllItems();
    setQuestions(interviewQuestions);
  };


  const joinMeeting = async () => {
    audioStream &&
      (audioStream as MediaStream)
        ?.getTracks()
        ?.forEach((track) => track?.stop());
    videoStream &&
      (videoStream as MediaStream)
        ?.getTracks()
        ?.forEach((track) => track?.stop());
    setJoined("JOINING");
    getHDVideo();
    join();
  };

  function getHDVideo() {
    [...participants.values()].forEach((participant: Participant) => {
      if (!participant.local) {
        participant.setQuality("high");
      }
    });
  }

  const startTheNextQuestion = () => {
    if (isInterviewComplete) {
      return;
    }
    setTimer(0);
    setQuestionNo(questionNo + 1);
  };
  const firstKey = participants.keys().next().value;
  const {
    webcamStream,
    webcamOn,
    captureImage,
  } = useParticipant(firstKey);

  const imageCountRef = useRef(0);

  async function imageCapture() {
    if (webcamOn && webcamStream) {
      try {
        const base64 = await captureImage({ height: 1000, width: 1000 });
        imageCountRef.current += 1;
        const imageNumber = imageCountRef.current;
        setCapturedImages(prev => [
          ...prev,
          {
            fileName: `image${imageNumber}`,
            base64: base64,
          }
        ]);


      } catch (error) {
        console.error("Error capturing image:", error);
      }
    } else {
      console.error("Camera must be on to capture an image");
    }
  }
  useEffect(() => {
    if (!isRecording || !questions?.length) return;
    const first = 0;
    const middle = Math.ceil(questions.length / 2) - 1;
    const last = questions.length - 1;

    if ((questionNo === first || questionNo === middle || questionNo === last) && isInterviewStarted) {
      imageCapture();
    }
  }, [isRecording, questionNo, isInterviewStarted]);
  const onCamTrigger = async (status?: string) => {
    if (cameraPermission == "granted" || cameraPermission == "prompt" || (status && (status == "granted" || status == "prompt"))) {
      toggleWebcam();
      videoStream &&
        (videoStream as MediaStream)
          ?.getTracks()
          .forEach((track) => track.stop());
      if (videoStream) {
        setVideoStream("");
        setCamOnOrNot(false);
      } else {
        setCamOnOrNot(true);
        const data = await getVideoTrack({ webcamId: selectedCam });
        setVideoStream(data as MediaStream);
      }
    } else {
      alert("Please allow camera in the settings");
    }
  };

  const onMicTrigger = async (status?: string) => {
    if (microphonePermission == "granted" || microphonePermission == "prompt" || (status && (status == "prompt" || status == "granted"))) {
      toggleMic();
      audioStream &&
        (audioStream as MediaStream)
          ?.getTracks()
          .forEach((track) => track.stop());
      if (audioStream) {
        setAudioStream("");
        setMicOnOrNot(false);
      } else {
        setMicOnOrNot(true);
        const audioStreamData = await getAudioTrack({ micId: selectedMic });
        setAudioStream(audioStreamData as MediaStream);
      }
    } else {
      alert("Please allow microphone in the settings");
    }
  };

  const videoPermissions = async () => {
    try {
      const requestVideoPermission = await requestPermission("video");
      if (requestVideoPermission?.get("video")) {

        let webcams = await getCameras();
        let updatedCams = removeDefaultDevice(webcams);

        setVideoDevicesList(updatedCams);
        setSelectedCam(updatedCams[0].deviceId);
        if (joined == "JOINED") {
          setSelectedCamInMeet(updatedCams[0].deviceId);
        }
        setCamOnOrNot(true);
      }
    } catch (err) {
      errPopper(err);
    }
  };

  const removeDefaultDevice = (devicesList: MicrophoneDeviceInfo[]) => {
    const defaultGroupId = devicesList?.find(
      (device) => device.deviceId === "default"
    )?.groupId;
    devicesList = devicesList.map((device) => {
      if (device.groupId === defaultGroupId && device.deviceId !== "default") {
        device.label = `Default - ${device?.label}`;
      }
      device.label = device.label[0]?.toUpperCase() + device.label?.slice(1);
      return device;
    });
    return devicesList.filter((device) => device?.deviceId !== "default");
  };

  const audioPermissions = async () => {
    const requestAudioPermission = await requestPermission("audio");

    const requestAudioOutputPermission = await requestPermission("audiooutput");

    if (requestAudioPermission?.get("audio")) {
      let mics = await getMicrophones();
      let updatedMics = removeDefaultDevice(mics);
      setAudioDevicesList(updatedMics);
      setSelectedMic(updatedMics[0].deviceId);
      const audioStreamData = await getAudioTrack({
        micId: updatedMics[0].deviceId,
      });
      if (joined == "JOINED") {
        setSelectedMicInMeet(updatedMics[0].deviceId);
      }
      setAudioStream(audioStreamData as MediaStream);
      setMicOnOrNot(true);
    }

    let speakers = await getPlaybackDevices();

    setSelectedPlayback(speakers[0]?.deviceId);
    if (joined == "JOINED") {
      setSelectedSpeakerInMeet(speakers[0].deviceId);
    }
    setPlaybackDevicesList(speakers);
  };

  const checkMediaPermission = async () => {
    try {
      await videoPermissions();
      await audioPermissions();
    } catch (ex) {
      console.error("Error in requestPermission ", ex);
    }
  };

  const getNetworkStatistics = async () => {
    try {
      const options = { timeoutDuration: 45000 };
      const networkStats = await getNetworkStats(options);

      const downloadSpeed = networkStats["downloadSpeed"];
      const uploadSpeed = networkStats["uploadSpeed"];

      setNetworkStats({ downloadSpeed, uploadSpeed });
    } catch (ex) {
      console.error("Error in networkStats: ", ex);
    }
  };

  const onChangeMic = async (deviceId: string) => {
    changeMic(deviceId);
    audioStream &&
      (audioStream as MediaStream)
        ?.getTracks()
        .forEach((track) => track.stop());

    const audioStreamData = await getAudioTrack({ micId: deviceId });

    setAudioStream(audioStreamData as MediaStream);

    const audioOutputDevice = new Map();
    const devices = await navigator.mediaDevices.enumerateDevices();
    for (const device of devices) {
      if (device.kind == "audiooutput")
        audioOutputDevice.set(device.deviceId, device);
    }
  };


  const handlePlaybackDeviceChange = async (deviceId: string) => {
    setSelectedPlayback(deviceId);
    const audioElements = Array.from(
      document.querySelectorAll<HTMLAudioElement>("audio")
    );

    let success = true;
    for (const audioElement of audioElements) {
      if (audioElement && "setSinkId" in audioElement) {
        try {
          await audioElement.setSinkId(deviceId);
        } catch (err) {
          console.error("Failed to set audio output device:", err);
          success = false;
        }
      } else {
        console.error("setSinkId not supported.");
        success = false;
      }
    }

    if (success) {
      console.warn("Audio output device changed successfully.");
    } else {
      console.warn("Some elements failed to update audio output device.");
    }
  };

  const testSpeakers = () => {
    const selectedSpeakerDeviceId = selectedPlayback;

    if (selectedSpeakerDeviceId) {
      const audio: HTMLAudioElement = new Audio(path);

      try {
        if (audio && typeof audio.setSinkId === "function") {
          audio
            .setSinkId(selectedSpeakerDeviceId)
            .then(() => {
              audio.play();
              setIsPlaying(true);
              audio.addEventListener("timeupdate", () => {
                const progress = (audio.currentTime / audio.duration) * 100;
                setAudioProgress(progress);
              });
              audio.addEventListener("ended", () => {
                setAudioProgress(0);
                setIsPlaying(false);
              });
            })
            .catch((error) => {
              console.error("Failed to set sinkId:", error);
            });
        } else {
          audio.play();
          console.warn("setSinkId is not supported on this browser.");
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      console.error("Selected speaker deviceId not found.");
    }
  };
  const getVideoTrackForCam = async () => {
    const data = await getVideoTrack({ webcamId: selectedCam });
    setVideoStream(data as MediaStream);
  };

  const handleMicChange = async (deviceId: string) => {
    setSelectedMic(deviceId);
    await onChangeMic(deviceId);
  };

  const handleCamChange = (deviceId: string) => {
    setSelectedCam(deviceId);
  };

  const handleCameraPermissionChange = (status: PermissionStatus) => {
    setCameraPermission(status.state);
    status.onchange = () => {
      setCameraPermission(status.state);
      if (status.state == "granted" || status.state == "prompt") {
        videoPermissions();
        onCamTrigger(status.state);
      } else {
        setVideoDevicesList([]);
        setSelectedCam("");
        setVideoStream("");
        setCamOnOrNot(false);
      }
    };
  };

  const handleMicrophonePermissionChange = (status: PermissionStatus) => {
    setMicrophonePermission(status.state);
    status.onchange = () => {
      setMicrophonePermission(status.state);
      if (status.state == "granted" || status.state == "prompt") {
        audioPermissions();
        onMicTrigger(status.state);
      } else {
        setAudioDevicesList([]);
        setSelectedMic("");
        setAudioStream("");
        setMicOnOrNot(false);
        setSelectedPlayback("");
        setPlaybackDevicesList([]);
      }
    };
  };

  useEffect(() => {
    navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then(handleCameraPermissionChange);

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then(handleMicrophonePermissionChange);
  }, []);

  useEffect(() => {
    onSpeakingPartipantChange();
  }, [activeSpeakingParticipant]);

  useEffect(() => {
    if (joined == "JOINED") {
      audioStream &&
        (audioStream as MediaStream)
          ?.getTracks()
          ?.forEach((track) => track?.stop());

      videoStream &&
        (videoStream as MediaStream)
          ?.getTracks()
          ?.forEach((track) => track?.stop());

      setAudioStream("");
      setVideoStream("");
    }
  }, [joined]);

  const [questionDurationTimer, setQuestionDurationTimer] = useState(0);
  useEffect(() => {
    const questionInterval = setInterval(() => {
      setQuestionDurationTimer(questionDurationTimer + 1);
    }, 1000);

    return () => {
      clearInterval(questionInterval);
    };
  }, [questionDurationTimer]);

  useEffect(() => {
    if (isInterviewStarted && !isInterviewComplete) {
      setQuestionDurationTimer(0);
    }
  }, [questionNo, isInterviewStarted]);

  useEffect(() => {
    if (
      isInterviewStarted &&
      timer &&
      !isInterviewComplete &&
      !isSettingUpInterview &&
      questionDurationTimer >= questions[questionNo]?.duration
    ) {
      const intervalId = setInterval(() => {
        const currentQuestion = questions[questionNo];
        const hasTimer = currentQuestion && Number(currentQuestion.time_limit) > 0;
        if (timer == 10 && !hasTimer && !isIOS()) {
          if (typeof window !== 'undefined' && !(window as any).questionProgressionInProgress) {
            (window as any).questionProgressionInProgress = true;
            startTheNextQuestion();
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                (window as any).questionProgressionInProgress = false;
              }
            }, 1000);
          }
        } else {
          let timerValue = timer + 1;
          setTimer(timerValue);
        }
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [timer, isInterviewStarted, questionDurationTimer]);

  useEffect(() => {
    if (selectedCam) {
      videoStream &&
        (videoStream as MediaStream)
          ?.getTracks()
          .forEach((track) => track.stop());
      getVideoTrackForCam();
    }
  }, [selectedCam]);

  useEffect(() => {
    checkMediaPermission();
    getNetworkStatistics();
  }, []);


  useEffect(() => {
    if (botSpeechDuration > 0) {
      const intervalId = setInterval(() => {
        let timerValue = botSpeechDuration - 1;
        setBotSpeechDuration(timerValue);
      }, 1000);

      return () => clearInterval(intervalId);
    } else {
      setBotSpeechDuration(0);
    }
  }, [botSpeechDuration]);

  useEffect(() => {
    updateAsPerQuestions();
  }, [interviewData]);
  return {
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
    counts,
    setCounts,
    capturedImages,
    setCapturedImages,
    isMicOnInMeeting,
    isWebcamOnInMeeting,
    selectedCamInMeet,
    selectedMicInMeet,
    selectedSpeakerInMeet,
    cameraPermission,
    microphonePermission,
    audioRef,
    submitError,
    setSubmitError,
    setTimer,
    setSelectedCamInMeet,
    setSelectedMicInMeet,
    setSelectedSpeakerInMeet,
    setIsWebcamOnInMeeting,
    setIsMicOnInMeeting,

    setBotSpeechRendered,
    setIsInterviewStarted,
    setIsIntroduction,
    startRec,
    setJoined,
    setSelectedCam,
    changeMicForTimer,
    setBotSpeechDuration,
    setQuestionDuration,
    setIsInterviewCompleted,
    onMicTrigger,
    onCamTrigger,
    setSelectedMic,
    onChangeMic,
    handlePlaybackDeviceChange,
    handleMicChange,
    handleCamChange,
    testSpeakers,
    joinMeeting,
    setIsSettingUpInterview,
    startTheNextQuestion,
    isRecording,
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
    isIOS,
  };
};

export default useMeetingHook;
