import { warningPopper } from "@/helpers/popper/warningPopper";
import { detectFacesAPI, detectSpoofAPI, verifyFaceAPI, getVideoSDKTokenAPI } from "@/https/services/videoSDK";
import { decodeToVideoSDKToken } from "@/lib/helpers/decodeToVideoSDKToken";
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
    captureStartScreenshotRef,
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
  const [apiFaceCount, setApiFaceCount] = useState<number>(0);
  const videoSdkTokenRef = useRef<string | null>(null);
  const isDetectingRef = useRef(false);
  const isVerifyingRef = useRef(false);
  const isMismatchStreakRef = useRef(false);
  const referenceImageRef = useRef<string | null>(null);
  const spoofCacheRef = useRef<{ spoof_detected: boolean; checkedAtCount: number } | null>(null);
  const captureVideoRef = useRef<HTMLVideoElement | null>(null);
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
  }, [pathname]);

  useEffect(() => {
    getVideoSDKTokenAPI()
      .then((response) => {
        if (response?.status === 200 || response?.status === 201) {
          const { accessToken } = response.data.data;
          videoSdkTokenRef.current = decodeToVideoSDKToken(accessToken);
        }
      })
      .catch((err) => console.error("VideoSDK token fetch error:", err));
  }, []);

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
        } catch (err: any) {
          if (err?.name === "AbortError") {
          } else {
            console.error("Failed to set audio output device:", err);
          }
          success = false;
        }
      } else {
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

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn, joined]);

  useEffect(() => {
    if (!captureVideoRef.current) {
      const el = document.createElement("video");
      el.muted = true;
      el.playsInline = true;
      captureVideoRef.current = el;
    }
    if (videoStream) {
      captureVideoRef.current.srcObject = videoStream;
      captureVideoRef.current.play().catch(() => {});
    } else {
      captureVideoRef.current.srcObject = null;
    }
    return () => {
      if (captureVideoRef.current) {
        captureVideoRef.current.srcObject = null;
      }
    };
  }, [videoStream]);

  const captureFrame = (): string | null => {
    const videoEl = captureVideoRef.current;
    if (!videoEl || videoEl.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth || 320;
    canvas.height = videoEl.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  };

  useEffect(() => {
    setIsWebcamOnInMeeting(webcamOn);
  }, [webcamOn, setIsWebcamOnInMeeting]);

  const onCamTrigger = async () => {
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

  const isFaceDetectionRunningRef = useRef(false);

  useEffect(() => {
    if (!webcamOn || !videoStream || !isRecording) return;

    let cancelled = false;

    const handleStartFaceDetection = async () => {
      if (isFaceDetectionRunningRef.current) return;
      try {
        isFaceDetectionRunningRef.current = true;
        const processedStream = await faceDetectionProcessor.start({
          stream: videoStream,
          options: { interval: 500 },
          callback: function (data: any) {
            if (!cancelled) setProcessedData(data);
          },
        });
        if (!cancelled) setProcessedStream(processedStream);
      } catch (err) {
        isFaceDetectionRunningRef.current = false;
        console.error("Face detection error:", err);
      }
    };

    handleStartFaceDetection();

    return () => {
      cancelled = true;
      isFaceDetectionRunningRef.current = false;
      faceDetectionProcessor.stop();
      setProcessedStream(null);
      setProcessedData({});
      spoofCacheRef.current = null;
    };
  }, [webcamOn, videoStream, isRecording, faceDetectionProcessor]);

  useEffect(() => {
    if (!webcamOn || !videoStream || !isRecording) return;
    const detectFacesInterval = setInterval(async () => {
      if (isDetectingRef.current || !videoSdkTokenRef.current) return;
      const base64 = captureFrame();
      if (!base64) return;
      isDetectingRef.current = true;
      try {
        const result = await detectFacesAPI({
          token: videoSdkTokenRef.current,
          imageBase64: base64,
        });
        let faceCount = result.number_of_faces ?? 0;
        if (faceCount > 1) {
          const needsCheck =
            spoofCacheRef.current === null ||
            faceCount > spoofCacheRef.current.checkedAtCount;
          if (needsCheck) {
            try {
              const spoofResult = await detectSpoofAPI({
                token: videoSdkTokenRef.current,
                imageBase64: base64,
              });
              spoofCacheRef.current = { spoof_detected: spoofResult.spoof_detected && spoofResult.accuracy > 0, checkedAtCount: faceCount };
            } catch {
              spoofCacheRef.current = { spoof_detected: false, checkedAtCount: faceCount };
            }
          }
          if (spoofCacheRef.current?.spoof_detected) faceCount = 1;
        } else {
          spoofCacheRef.current = null;
        }
        setApiFaceCount(faceCount);
      } catch {
      } finally {
        isDetectingRef.current = false;
      }
    }, 3000);
    return () => clearInterval(detectFacesInterval);
  }, [webcamOn, videoStream, isRecording]);
  useEffect(() => {
    if (!isRecording || !isInterviewStarted || referenceImageRef.current || !videoStream) return;
    if (interviewType === "MCQ" && currentStage !== "questions") return;

    let cancelled = false;

    const captureAndValidateReference = async () => {
      if (cancelled) return;
      if (!videoSdkTokenRef.current) {
        setTimeout(captureAndValidateReference, 500);
        return;
      }
      const base64 = captureFrame();
      if (!base64) {
        setTimeout(captureAndValidateReference, 500);
        return;
      }
      try {
        const [detectResult] = await Promise.all([
          detectFacesAPI({ token: videoSdkTokenRef.current, imageBase64: base64 }),
          captureStartScreenshotRef?.current?.(),
        ]);
        if (cancelled) return;
        let faceCount = detectResult.number_of_faces ?? 0;
        if (faceCount > 1) {
          const needsCheck =
            spoofCacheRef.current === null ||
            faceCount > spoofCacheRef.current.checkedAtCount;
          if (needsCheck) {
            try {
              const spoofResult = await detectSpoofAPI({
                token: videoSdkTokenRef.current,
                imageBase64: base64,
              });
              spoofCacheRef.current = { spoof_detected: spoofResult.spoof_detected && spoofResult.accuracy > 0, checkedAtCount: faceCount };
            } catch {
              spoofCacheRef.current = { spoof_detected: false, checkedAtCount: faceCount };
            }
          }
          if (spoofCacheRef.current?.spoof_detected) faceCount = 1;
        } else {
          spoofCacheRef.current = null;
        }
        setApiFaceCount(faceCount);
        latestApiFaceCountRef.current = faceCount;
        if (faceCount === 1) {
          referenceImageRef.current = base64;
          runFaceVerification();
        } else {
          setTimeout(captureAndValidateReference, 1000);
        }
      } catch {
        if (!cancelled && !referenceImageRef.current) {
          referenceImageRef.current = base64;
        }
      }
    };

    captureAndValidateReference();
    return () => { cancelled = true; };
  }, [isRecording, isInterviewStarted, videoStream, interviewType, currentStage]);

  const runFaceVerification = async () => {
    if (isVerifyingRef.current || !videoSdkTokenRef.current || !referenceImageRef.current) return;
    if (latestApiFaceCountRef.current !== 1) return;
    const currentImage = captureFrame();
    if (!currentImage) return;
    isVerifyingRef.current = true;
    try {
      const result = await verifyFaceAPI({
        token: videoSdkTokenRef.current,
        referenceImage: referenceImageRef.current,
        currentImage,
      });
      if (!result.is_same_person) {
        // Only count the START of a new mismatch streak (consecutive mismatches = count 1)
        if (!isMismatchStreakRef.current) {
          const awayTime = Date.now();
          detectionCounts.current.face_verification_mismatch_count += 1;
          detectionCounts.current.eyeTimeIntervals.faceVerification.push({ awayTime, inTime: null });
          detectionCounts.current.face_verification_mismatch = true;
          isMismatchStreakRef.current = true;
        }
      } else {
        // Verified as same person → close the open mismatch interval
        if (isMismatchStreakRef.current) {
          const lastInterval = detectionCounts.current.eyeTimeIntervals.faceVerification.slice(-1)[0];
          if (lastInterval && lastInterval.inTime === null) {
            lastInterval.inTime = Date.now();
          }
          detectionCounts.current.face_verification_mismatch = false;
          isMismatchStreakRef.current = false;
        }
      }
    } catch {
    } finally {
      isVerifyingRef.current = false;
    }
  };

  useEffect(() => {
    if (!isRecording || !isInterviewStarted || !webcamOn || !videoStream || (interviewType === "MCQ" && currentStage !== "questions")) return;
    const verifyInterval = setInterval(runFaceVerification, 5000);
    return () => clearInterval(verifyInterval);
  }, [isRecording, isInterviewStarted, webcamOn, videoStream, interviewType, currentStage]);

  const prevApiFaceCountRef = useRef(apiFaceCount);
  useEffect(() => {
    const prev = prevApiFaceCountRef.current;
    prevApiFaceCountRef.current = apiFaceCount;
    if (prev > 1 && apiFaceCount === 1 && isRecording && isInterviewStarted && referenceImageRef.current) {
      runFaceVerification();
    }
  }, [apiFaceCount, isRecording, isInterviewStarted]);

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
    if (!isRecording || (interviewType === "MCQ" && currentStage != "questions")) return;

    if (apiFaceCount === 0) {
      detectionCounts.current.lastFaceCount = 0;
      detectionCounts.current.no_face_detected = true;
      detectionCounts.current.face_detected = false;
      if (detectionCounts.current.multiple_face_detected) {
        const lastInterval = detectionCounts.current.eyeTimeIntervals.multiFaces.slice(-1)[0];
        if (lastInterval && lastInterval.inTime === null) {
          lastInterval.inTime = Date.now();
        }
        detectionCounts.current.multiple_face_detected = false;
      }
      return;
    }

    detectionCounts.current.no_face_detected = false;
    detectionCounts.current.face_detected = true;

    const multiFacesThreshold = 1;

    if (apiFaceCount > multiFacesThreshold) {
      const awayTime = Date.now();
      if (!detectionCounts.current.multiple_face_detected) {
        detectionCounts.current.multiple_face_detected_count += 1;
        detectionCounts.current.eyeTimeIntervals.multiFaces.push({ awayTime, inTime: null });
      }
      detectionCounts.current.lastFaceCount = apiFaceCount;
      detectionCounts.current.multiple_face_detected = true;

      if (!firstAlert) {
        warningPopper("Multiple faces detected");
        setFirstAlert(true);
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
  }, [apiFaceCount, isRecording]);

  const multiFaceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestApiFaceCountRef = useRef<number>(0);
  useEffect(() => {
    if (apiFaceCount <= 1) {
      setFirstAlert(false);
    }
    latestApiFaceCountRef.current = apiFaceCount;
  }, [apiFaceCount]);

  useEffect(() => {
    if (firstAlert) {
      if (multiFaceIntervalRef.current) {
        clearInterval(multiFaceIntervalRef.current);
      }
      multiFaceIntervalRef.current = setInterval(() => {
        if (latestApiFaceCountRef.current > 1) {
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

    const userAbsenceEvent = new CustomEvent('user-absence-detected', {
      detail: {
        timestamp: Date.now(),
        message: "User absence detected"
      }
    });
    window.dispatchEvent(userAbsenceEvent);

    warningPopper("Keep your face visible, or the interview will submit automatically")

    setCounts((prevCounts) => {
      const updatedCounts = {
        ...prevCounts,
        video: prevCounts.video + 1,
      };
      return updatedCounts;
    });

    intervalRef.current = setInterval(() => {
      const userAbsenceEvent = new CustomEvent('user-absence-detected', {
        detail: {
          timestamp: Date.now(),
          message: "User absence detected"
        }
      });
      window.dispatchEvent(userAbsenceEvent);

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
        intervalRef.current = null;
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