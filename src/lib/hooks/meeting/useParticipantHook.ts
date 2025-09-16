import { warningPopper } from "@/helpers/popper/warningPopper";
import {
  IuseParticipantHookReturnType,
  ParticipantViewProps,
} from "@/lib/interfaces/meeting";
import { useBaselimeRum } from "@baselime/react-rum";
import { useMeeting, useParticipant } from "@videosdk.live/react-sdk";
import { FaceDetectionProcessor } from "@videosdk.live/videosdk-media-processor-web";
import dayjs from "dayjs";
import { useParams, usePathname } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
const useParticipantHook = (
  props: Omit<ParticipantViewProps, "playbackDevicesList">
): IuseParticipantHookReturnType => {
  useParticipantHook
  const {
    participantId,
    audioDevicesList,
    videoDevicesList,
    selectedCam,
    joined,
    selectedMic,
    selectedPlayback,
    meetingId,
    botSpeechDuration,
    selectedCamInMeet,
    selectedMicInMeet,
    selectedSpeakerInMeet,
    setSelectedCamInMeet,
    setSelectedMicInMeet,
    setSelectedSpeakerInMeet,
    setJoined,
    changeMicForTimer,
    setBotSpeechDuration,
    questionDuration,
    setQuestionDuration,
    isInterviewStarted,
    botSpeechRendered,
    setBotSpeechRendered,
    setIsWebcamOnInMeeting,
    setIsMicOnInMeeting,
    cameraPermission,
    microphonePermission,
    audioRef,
    counts,
    setCounts,
    capturedImages,
    setCapturedImages,
    detectionCounts,
    isInterviewComplete,
    isRecording,
    endCall,
    setEndCall,
    interviewType,
    setInterviewType,
    currentStage,
    videoStreamOff,
    setVideoStreamOff,

  } = props;
  const { sendEvent } = useBaselimeRum();

  const micRef = useRef<HTMLVideoElement>(null);
  const [micAnchorEL, setMicAnchorEl] = useState<null | HTMLElement>(null);
  const [cameraAnchorEL, setCameraAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const { interview_id, candidate_code } = useParams();
  const [rendered, setRendered] = useState(true);
  const pathname = usePathname();
  const [exceededThirtySeconds, setExceededThirtySeconds] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [thresholds, setThresholds] = useState({ horizontal: 47, vertical: 47 })
  const [processedStream, setProcessedStream] = useState(null);
  const [processedData, setProcessedData] = useState<any>({});
  const [firstAlert, setFirstAlert] = useState<boolean>(false);
  const [isProcessingFaceDetection, setIsProcessingFaceDetection] = useState(false);

  useEffect(() => {
    if (pathname) {
      const pathSegments = pathname.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];

      if (lastSegment !== "source-device-desktop") {
        setThresholds({ horizontal: 44, vertical: 44 });
      } else {
        setThresholds({ horizontal: 47, vertical: 47 });
      }
    }
  }, [pathname])



  const logEvent = ({
    kind,
    newStatus,
    loggerMessage,
    leaveCount,
    video,
    audio,

  }: {
    kind: "audio" | "video" | "screen";
    newStatus: boolean;
    loggerMessage: string;
    leaveCount?: number;
    video?: number;
    audio?: number;

  }) => {
    const options = {
      resource: kind,
      status: newStatus,
      timestamp: dayjs().toISOString(),
      candidate_code: candidate_code,
      interview_id: interview_id,
      leaveCount: leaveCount,
      video: video,
      audio: audio,


      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      colorDepth: window.screen.colorDepth,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    };
    sendEvent(loggerMessage, options);
  };


  const onMediaStatusChanged = ({
    kind,
    peerId,
    newStatus,
  }: {
    kind: "audio" | "video";
    peerId: string;
    newStatus: boolean;
  }) => {
    if (!newStatus) {

      const awayTime = Date.now();


      setCounts((prevCounts) => ({
        ...prevCounts,
        [kind]: prevCounts[kind] + 1,
        [`${kind}TimeIntervals`]: [
          ...prevCounts[`${kind}TimeIntervals`],
          { awayTime, inTime: null },
        ],
      }));

      logEvent({
        kind,
        newStatus,
        loggerMessage: "Media Disabled",
        audio: counts.audio,
        video: counts.video,
      });
    } else {

      const inTime = Date.now();


      setCounts((prevCounts) => {
        const lastInterval =
          prevCounts[`${kind}TimeIntervals`][
          prevCounts[`${kind}TimeIntervals`].length - 1
          ];


        if (lastInterval && lastInterval.inTime === null) {
          return {
            ...prevCounts,
            [`${kind}TimeIntervals`]: [
              ...prevCounts[`${kind}TimeIntervals`].slice(0, -1),
              { ...lastInterval, inTime },
            ],
          };
        }


        return prevCounts;
      });

      logEvent({
        kind,
        newStatus,
        loggerMessage: "Media Enabled",
        audio: counts.audio,
        video: counts.video,
      });
    }
  };





  const {
    displayName: participantName,
    isActiveSpeaker,
    webcamStream,
    micStream,
    webcamOn,
    micOn,
    setQuality,

  } = useParticipant(participantId, { onMediaStatusChanged });

  const { leave, toggleMic, toggleWebcam, changeWebcam, changeMic } =
    useMeeting();


  const leaveTheMeeting = () => {
    setEndCall && setEndCall(true);

  };
  const openMicAndSpeakerOptions = (event: MouseEvent<HTMLDivElement>) => {
    if (audioDevicesList.length) {
      setMicAnchorEl(event.currentTarget);
    } else {
      setMicAnchorEl(null);
    }
  };
  const openCameraOptions = (event: MouseEvent<HTMLDivElement>) => {
    if (videoDevicesList.length) {
      setCameraAnchorEl(event.currentTarget);
    } else {
      setCameraAnchorEl(null);
    }
  };

  const onChangeWebCamInMeeting = (camId: string) => {
    changeWebcam(camId);
    setSelectedCamInMeet(camId);
    setCameraAnchorEl(null);
  };
  const onChanceMicInMeeting = (micId: string) => {
    changeMic(micId);
    setSelectedMicInMeet(micId);
    setMicAnchorEl(null);
  };

  const validateDeviceAvailability = async (deviceId: string) => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioOutputDevices = devices.filter(
      (device) => device.kind === "audiooutput"
    );

    return audioOutputDevices.some((device) => device.deviceId === deviceId);
  };

  const onChangeSpeakerInMeeting = async (selectedDeviceId: string) => {
    setSelectedSpeakerInMeet(selectedDeviceId);
    setMicAnchorEl(null);

    const isDeviceAvailable = await validateDeviceAvailability(
      selectedDeviceId
    );

    if (!isDeviceAvailable) {
      console.error(`Selected device ID ${selectedDeviceId} is not available.`);
      return;
    }

    const mediaElements = Array.from(
      document.querySelectorAll<HTMLMediaElement>("audio, video")
    );

    let success = true;

    if (mediaElements.length === 0) {
      console.warn(
        "No media elements found to update the audio output device."
      );
      return;
    }

    for (const mediaElement of mediaElements) {
      if (mediaElement && "setSinkId" in mediaElement) {
        try {
          await mediaElement.setSinkId(selectedDeviceId || "");
          console.warn(
            `Audio output device set to ${selectedDeviceId || "default"
            } for element`,
            mediaElement
          );
        } catch (err: any) {
          if (err?.name === "AbortError") {
            console.error(
              "Failed to set audio output device: The operation was aborted."
            );
          } else {
            console.error("Failed to set audio output device:", err);
          }
          success = false;
        }
      } else {
        console.error(
          "setSinkId is not supported on this media element or it is not accessible."
        );
        success = false;
      }
    }

    if (success) {
      console.warn("Audio output device changed successfully.");
    } else {
      console.warn(
        "Some media elements did not update their audio output device."
      );
    }
  };

 const videoStream = useMemo<MediaStream | undefined>(() => {
  if (webcamOn && webcamStream) {
    const ms = new MediaStream();
    ms.addTrack(webcamStream.track);
    return ms;
  }
  return undefined;
}, [webcamStream, webcamOn, joined]);

useEffect(() => {
  setIsWebcamOnInMeeting(webcamOn);
}, [webcamOn, setIsWebcamOnInMeeting]);

  const onCamTrigger = async () => {
    // takeSS()
    if (cameraPermission == "granted") toggleWebcam();


    if (cameraPermission == "denied") {
      alert("Please allow camera in the settings");
    }
  };

  const onMicTrigger = () => {
    if (microphonePermission == "granted") toggleMic();
    if (microphonePermission == "denied") {
      alert("Please allow microphone in the settings");
    }
  };


  const setMicStreamFrom = async () => {
    changeMicForTimer(micOn);
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();

        mediaStream.addTrack(micStream.track);

        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) =>
            console.error("videoElem.current.play() failed", error)
          );
      } else {
        micRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    setRendered(false);
    setTimeout(() => {
      setRendered(true);
    }, 1);
  }, [isActiveSpeaker]);

  useEffect(() => {
    setMicStreamFrom();
    setIsMicOnInMeeting(micOn);
  }, [micStream, micOn]);

  useEffect(() => {
    if (joined == "JOINED") {
      setSelectedMicInMeet(selectedMic);
      setSelectedCamInMeet(selectedCam);
      setSelectedSpeakerInMeet(selectedPlayback);
    }
    setQuality("high");
  }, [joined]);

  useEffect(() => {
    if (
      isInterviewStarted &&
      (botSpeechDuration <= 0 || questionDuration == botSpeechDuration)
    ) {
      setBotSpeechRendered(false);
      setTimeout(() => {
        setBotSpeechRendered(true);
      }, 1);
    }
  }, [botSpeechDuration, isInterviewStarted]);



  useEffect(() => {


    const handleBeforeUnload = () => {
      if (document.hidden) {
        const awayTime = Date.now();

        setCounts((prevCounts) => ({
          ...prevCounts,
          leaveCount: prevCounts.leaveCount + 1,
          timeIntervals: [...prevCounts.timeIntervals, { awayTime, inTime: null }]
        }));
        logEvent({
          kind: "screen",
          newStatus: false,
          loggerMessage: "Tab switched",

        });
      } else {
        const inTime = Date.now()

        setCounts((prevCounts) => {
          const lastInterval = prevCounts.timeIntervals[prevCounts.timeIntervals.length - 1];
          return {
            ...prevCounts,
            timeIntervals: [...prevCounts.timeIntervals.slice(0, -1), { ...lastInterval, inTime }]
          }
        });
        logEvent({
          kind: "screen",
          newStatus: true,
          loggerMessage: "Tab switched",
          leaveCount: counts.leaveCount,
        });
      }
    };

    window.addEventListener("visibilitychange", handleBeforeUnload);
    return () => {
      window.removeEventListener("visibilitychange", handleBeforeUnload);
    };
  }, [counts.leaveCount]);

  const faceDetectionProcessor = useMemo(() => {
    return new FaceDetectionProcessor();
  }, []);
  useEffect(() => {
    const handleStartFaceDetection = async () => {
      if (videoStream) {
        try {
          const processedStream = await faceDetectionProcessor.start({
            stream: videoStream,
            options: {
              interval: 500,
            },
            callback: function (data: any) {
              setProcessedData(data);
            },
          });
          setProcessedStream(processedStream);
        } catch (err) {
          console.error("Face detection error:", err);
        }
      }
    };

    if (webcamOn) {
      handleStartFaceDetection();

      return () => {
        faceDetectionProcessor.stop();
        setProcessedStream(null);
        setProcessedData({});
      };
    }
    handleStartFaceDetection()
  }, [webcamOn, videoStream, faceDetectionProcessor]);


  useEffect(() => {
    if (!processedData?.faceLandMark || !isRecording || (interviewType === "MCQ" && currentStage != "questions")) return;
    const { eyeLookOutLeft, eyeLookOutRight, eyeLookInLeft, eyeLookInRight, eyeLookUpLeft, eyeLookUpRight, eyeLookDownLeft, eyeLookDownRight } = processedData.faceLandMark;
    let direction = "";
    const isLookingAway =
      (((eyeLookOutLeft > thresholds.horizontal) && (eyeLookInRight > thresholds.horizontal + 20)) ? direction = "left" : "") ||
      (((eyeLookOutRight > thresholds.horizontal) && (eyeLookInLeft > thresholds.horizontal + 20)) ? direction = "right" : "") ||
      (eyeLookUpLeft > thresholds.vertical && (direction = "up")) ||
      (eyeLookUpRight > thresholds.vertical && (direction = "up")) ||
      (eyeLookDownLeft > thresholds.vertical && (direction = "down")) ||
      (eyeLookDownRight > thresholds.vertical && (direction = "down"));

    if (isLookingAway) {
      const directionKey = direction.trim();
      if (!detectionCounts.current.isLookingAway || detectionCounts.current.lastDirection !== direction) {
        const awayTime = Date.now();

        switch (directionKey) {
          case "left":
            detectionCounts.current.eye_left_count += 1;
            detectionCounts.current.eyeTimeIntervals.left.push({ awayTime, inTime: null });
            break;
          case "right":
            detectionCounts.current.eye_right_count += 1;
            detectionCounts.current.eyeTimeIntervals.right.push({ awayTime, inTime: null });
            break;
          case "up":
            detectionCounts.current.eye_up_count += 1;
            detectionCounts.current.eyeTimeIntervals.up.push({ awayTime, inTime: null });
            break;
          case "down":
            detectionCounts.current.eye_down_count += 1;
            detectionCounts.current.eyeTimeIntervals.down.push({ awayTime, inTime: null });
            break;
        }

        detectionCounts.current.isLookingAway = true;
        detectionCounts.current.lastDirection = direction;
      }
    } else if (detectionCounts.current.isLookingAway) {
      const inTime = Date.now();

      const lastDirection = detectionCounts.current.lastDirection;
      if (lastDirection) {
        const lastInterval = detectionCounts.current.eyeTimeIntervals[lastDirection]?.slice(-1)[0];
        if (lastInterval && lastInterval.inTime === null) {
          lastInterval.inTime = inTime;
        }
      }
      detectionCounts.current.isLookingAway = false;
      detectionCounts.current.lastDirection = null;
    }
  }, [processedData, webcamOn, videoStream, faceDetectionProcessor, isRecording]);


  useEffect(() => {

    if (!processedData?.faceDetected || processedData.faceDetected === 0) {
      detectionCounts.current.lastFaceCount = 0;
      return;
    }
    const faceCount = processedData.faceDetected;
    const multiFacesThreshold = 1;
    const multiFaces = faceCount > multiFacesThreshold ? faceCount : 1;


    if (multiFaces > multiFacesThreshold) {

      const awayTime = Date.now();
      if (multiFaces !== detectionCounts.current.lastFaceCount) {
        if (multiFaces > detectionCounts.current.lastFaceCount) {
          detectionCounts.current.multiple_face_detected_count += 1;
        }
        detectionCounts.current.eyeTimeIntervals.multiFaces.push({ awayTime, inTime: null });
        detectionCounts.current.lastFaceCount = multiFaces;
        detectionCounts.current.multiple_face_detected = true;
      }
      if (!firstAlert) {
        warningPopper("Multiple faces detected");
        setFirstAlert(true)
      }
    } else {

      if (detectionCounts.current.multiple_face_detected) {
        const inTime = Date.now();
        const lastInterval = detectionCounts.current.eyeTimeIntervals.multiFaces.slice(-1)[0];
        if (lastInterval && lastInterval.inTime === null) {
          lastInterval.inTime = inTime;
        }
        detectionCounts.current.lastFaceCount = 1;
        detectionCounts.current.multiple_face_detected = false;
      }
    }
  }, [processedData, webcamOn, videoStream, faceDetectionProcessor, isRecording]);

  const multiFaceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestProcessedDataRef = useRef<any>({});
  useEffect(() => {
    if (processedData?.faceDetected === 1) {
      setFirstAlert(false)
    }
    latestProcessedDataRef.current = processedData;
  }, [processedData]);

  useEffect(() => {
    if (firstAlert) {
      if (multiFaceIntervalRef.current) {
        clearInterval(multiFaceIntervalRef.current);
      }
      multiFaceIntervalRef.current = setInterval(() => {
        const currentFaceCount = latestProcessedDataRef.current?.faceDetected;

        if (currentFaceCount > 1) {
          warningPopper("Multiple faces are detected");
        }
      }, 5000);
    }

    return () => {
      if (multiFaceIntervalRef.current) {
        clearInterval(multiFaceIntervalRef.current);
        multiFaceIntervalRef.current = null;
      }
    };
  }, [firstAlert]);

  useEffect(() => {
    if (!processedData?.faceLandMark || !isRecording || (interviewType === "MCQ" && currentStage != "questions")) return;
    const {
      eyeBlinkLeft, eyeBlinkRight, eyeLookUpLeft, eyeLookUpRight,
      noseSneerLeft, noseSneerRight,
      mouthClose, mouthSmileLeft, mouthSmileRight, mouthOpen
    } = processedData.faceLandMark || {};
    const isEyesDetected = eyeBlinkLeft > 0 || eyeLookUpLeft > 0 || eyeBlinkRight > 0 || eyeLookUpRight > 0;
    const isNoseDetected = noseSneerLeft > 0 || noseSneerRight > 0;
    const isMouthDetected = mouthClose > 0 || mouthSmileLeft > 0 || mouthSmileRight > 0 || mouthOpen > 0;
    if (!(isEyesDetected && isNoseDetected && isMouthDetected)) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          setExceededThirtySeconds(true);
        }, 5000);
      }

    } else {
      setExceededThirtySeconds(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [processedData, webcamOn, videoStream, faceDetectionProcessor, isRecording]);
  useEffect(() => {
    if (!exceededThirtySeconds || isInterviewComplete || !isRecording || (interviewType === "MCQ" && currentStage != "questions")) return;
    if (isRecording && videoStream === undefined) return;
    warningPopper("Keep your face visible, or the interview will submit automatically")

    setCounts((prevCounts) => {
      const updatedCounts = {
        ...prevCounts,
        video: prevCounts.video + 1,
      };
      return updatedCounts;
    });

    intervalRef.current = setInterval(() => {
      warningPopper("Keep your face visible, or the interview will submit automatically");

      setCounts((prevCounts) => {
        const updatedCounts = {
          ...prevCounts,
          video: prevCounts.video + 1,
        };
        return updatedCounts;
      });

    }, 5000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null
      }
    };
  }, [exceededThirtySeconds, isRecording, videoStream]);

  const videoStreamOffTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isRecording && videoStream === undefined) {
      warningPopper("Turn on the video stream otherwise interview will be submitted after 10 seconds");
      videoStreamOffTimerRef.current = setTimeout(() => {
        if (isRecording && !videoStream) {
          warningPopper("Your interview will be submitted due to not enabling the video stream");
          setVideoStreamOff(true);
        }
      }, 10000);
    } else {
      if (videoStreamOffTimerRef.current) {
        clearTimeout(videoStreamOffTimerRef.current);
        videoStreamOffTimerRef.current = null;
      }
    }
    return () => {
      if (videoStreamOffTimerRef.current) {
        clearTimeout(videoStreamOffTimerRef.current);
        videoStreamOffTimerRef.current = null;
      }
    };
  }, [videoStream, isRecording]);





  return {
    webcamOn,
    webcamStream,
    micStream,
    videoStream: videoStream as MediaStream,
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
    toggleMic: onMicTrigger,
    openMicAndSpeakerOptions,
    toggleWebcam: onCamTrigger,
    openCameraOptions,
    leaveTheMeeting,
    setMicAnchorEl,
    onChanceMicInMeeting,
    onChangeSpeakerInMeeting,
    setCameraAnchorEl,
    onChangeWebCamInMeeting,
  };
};

export default useParticipantHook;