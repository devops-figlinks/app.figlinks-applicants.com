import {
  deleteItemByIdIntroConclude,
  getItemByIdIntroConclude,
} from "@/helpers/indexedDBIntroConclude";
import { deleteObject, getAllItems } from "@/helpers/indexedDBQuestions";
import { errPopper } from "@/helpers/popper/errPopper";
import { successPopper } from "@/helpers/popper/successPopper";
import { IQuesTime } from "@/lib/interfaces/interviews";
import {
  IQuestioningBlock,
  IUseQuestionHookReturnType,
  OnIOSPlayClickType
} from "@/lib/interfaces/meeting";
import {
  interviewUserImagesAPI,
  saveInterviewAPI,
} from "@/https/services/interviews";
import { useMeeting } from "@videosdk.live/react-sdk";
import dayjs from "dayjs";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const useQuestionsHook = ({
  questions,
  questionNo,
  setBotSpeechDuration,
  setQuestionDuration,
  interviewData,
  setQuestions,
  setBotSpeechRendered,
  setIsInterviewStarted,
  isInterviewStarted,
  detectionCounts,
  setIsInterviewCompleted,
  isMicOnInMeeting,
  isWebcamOnInMeeting,
  selectedSpeakerInMeet,
  audioRef,
  videoSDKToken,
  meetingId,
  startRec,
  setTimer,
  isRecording,
  counts,
  setCounts,
  capturedImages,
  setCapturedImages,
  submitError,
  setSubmitError,
  startTheNextQuestion,
  endCall,
  setEndCall,
  interviewType,
  setInterviewType,
  questionAnswers,
  interviewTimes,
  setQuestionAnswers,
  setInterviewTimes,
  currentStage,
  setCurrentStage,
  videoStreamOff,
  setVideoStreamOff,
  joined,
}: IQuestioningBlock): IUseQuestionHookReturnType => {
  const pathname = usePathname();
  const { interview_id, candidate_code } = useParams();
  const [renderTypeWriter, setRenderTypeWriter] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [questionsWithTimeStamps, setQuestionsWithTimeStamps] = useState<IQuesTime[]>([]);
  const [showNextButtonOrNot, setShowNextButtonOrNot] = useState(false);
  const [submittingInterview, setSubmittingInterview] = useState(false);
  const [isDurationCompleted, setIsDurationCompleted] = useState(false);
  const { stopRecording, localParticipant } = useMeeting();
  const [timer1, setTimer1] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const randomTimes = useMemo(() => questions.map((q) => q.time_limit), [questions]);
  const [isIosInterview, setIsIosInterview] = useState(false);
  const [userInteractionCaptured, setUserInteractionCaptured] = useState(false);
  const [preloadedFirstQuestionAudio, setPreloadedFirstQuestionAudio] = useState<HTMLAudioElement | null>(null);
  const [audioPreloadAttempts, setAudioPreloadAttempts] = useState(0);
  const MAX_AUDIO_PRELOAD_ATTEMPTS = 3;

  const isSubmittingRef = useRef(false);

  const multiFaceCaptureCount = useRef(0);
  const eyeTransitionCaptureCount = useRef(0);
  const cameraDisableCaptureCount = useRef(0);
  const fixedScreenshotFlags = useRef({
    start: false,
    mid: false,
    end: false
  });
  
  const prevMultiFaceCount = useRef(0);
  const prevEyeLeftCount = useRef(0);
  const prevEyeRightCount = useRef(0);
  const prevCameraDisableCount = useRef(0);
  
  const lastEyeCaptureTime = useRef<number>(0);
  const lastMultiFaceCaptureTime = useRef<number>(0);
  const lastCameraDisableCaptureTime = useRef<number>(0);
  const MIN_CAPTURE_INTERVAL = 1000;
  
  const fileKeysRef = useRef<string[]>([]);
const session_id = useMemo(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().substring(0, 8);
    }
    return `s_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
  }, []);
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  const isSafari = () => {
    if (navigator.userAgent.includes("Chrome")) return false;
    if (navigator.userAgent.includes("Firefox")) return false;
    return (
      /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent) ||
      /iPad|iPhone|iPod/.test(navigator.userAgent)
    );
  };

  function getMediaDuration(url: string) {
    return new Promise((resolve, reject) => {
      const media = new Audio();
      media.src = url;

      media.addEventListener("loadedmetadata", () => {
        resolve(media.duration);
      });

      media.addEventListener("error", (e) => {
        reject(`Error loading media: ${e.message}`);
      });

      if (isIOS()) {
        media.load();
      }
    });
  }

  const getDurationByQuestionAudio = async () => {
    try {
      const duration = await getMediaDuration(questions[questionNo]?.qtn_audio_url);
      setBotSpeechDuration(duration as number);
      setQuestionDuration(duration as number);
    } catch (error) {
      console.error("Error getting question audio duration:", error);
      return 5;
    }
  };

  const getDuration = async (audioString: string) => {
    try {
      return await getMediaDuration(audioString);
    } catch (error) {
      console.error("Error getting audio duration:", error);
      return 5;
    }
  };

  const getSinkIdAndPlay = async (audio: HTMLAudioElement) => {
    if (isSafari()) {
      try {
        await audio.play();
      } catch (err) {
        console.error("Safari audio playback failed:", err);
      }
    } else if (!isIOS() && "setSinkId" in audio) {
      try {
        await audio.setSinkId(selectedSpeakerInMeet);
        await audio.play();
      } catch (err) {
        console.error("Audio output selection failed:", err);
      }
    } else {
      console.error("setSinkId is not supported on this browser.");
    }
  };

  const introPlayedRef = useRef(false);

  const captureImage = (): Promise<{ fileName: string; base64: string } | null> => {
    return new Promise((resolve) => {
      const videoStreamEntry = localParticipant?.streams
        ? Array.from(localParticipant.streams.values()).find(
            (stream: any) => stream.kind === "video"
          )
        : undefined;

      const videoStream = videoStreamEntry?.track
        ? new MediaStream([videoStreamEntry.track])
        : undefined;

      if (!videoStream) {
        resolve(null);
        return;
      }

      const video = document.createElement("video");
      video.srcObject = videoStream;
      video.muted = true;
      video.playsInline = true;

      const onError = () => {
        video.srcObject = null;
        resolve(null);
      };

      video.addEventListener("error", onError);

      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});

        let captureAttempts = 0;
        const maxCaptureAttempts = 5;

        const drawFrame = () => {
          if (video.readyState >= 2) {
            const canvas = document.createElement("canvas");
            canvas.width = Math.min(video.videoWidth || 640, 1920);
            canvas.height = Math.min(video.videoHeight || 480, 1080);

            const ctx = canvas.getContext("2d");
            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64 = canvas.toDataURL("image/jpeg", 0.92);
              const timestamp = Date.now();
              const fileName = `screenshot_${timestamp}.jpg`;

              video.pause();
              video.srcObject = null;
              video.removeEventListener("error", onError);

              resolve({ fileName, base64 });
              return;
            }
          }
          
          captureAttempts++;
          if (captureAttempts < maxCaptureAttempts) {
            requestAnimationFrame(drawFrame);
          } else {
            video.pause();
            video.srcObject = null;
            video.removeEventListener("error", onError);
            resolve(null);
          }
        };

        drawFrame();
      });

      setTimeout(() => {
        video.srcObject = null;
        video.removeEventListener("error", onError);
        resolve(null);
      }, 8000);
    });
  };

  const uploadImageData = async (imageData: { fileName: string; base64: string }, captureType: string) => {
    try {
      const response = await interviewUserImagesAPI({
        payload: {
          file_name: imageData.fileName,
          base64: imageData.base64,
          session_id,
        },
        interviewId: interview_id as string,
        candidateCode: candidate_code as string,
      });

      if (response.status === 200 || response.status === 201) {
        fileKeysRef.current.push(response.data.data.file_key);
        return response.data.data.file_key;
      } else {
        if (captureType.includes("absence")) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryResponse = await interviewUserImagesAPI({
            payload: {
              file_name: imageData.fileName,
              base64: imageData.base64,
              session_id,
            },
            interviewId: interview_id as string,
            candidateCode: candidate_code as string,
          });
          
          if (retryResponse.status === 200 || retryResponse.status === 201) {
            fileKeysRef.current.push(retryResponse.data.data.file_key);
            return retryResponse.data.data.file_key;
          }
        }
        return null;
      }
    } catch (error) {
      if (captureType.includes("absence")) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const retryResponse = await interviewUserImagesAPI({
            payload: {
              file_name: imageData.fileName,
              base64: imageData.base64,
              session_id,
            },
            interviewId: interview_id as string,
            candidateCode: candidate_code as string,
          });
          
          if (retryResponse.status === 200 || retryResponse.status === 201) {
            fileKeysRef.current.push(retryResponse.data.data.file_key);
            return retryResponse.data.data.file_key;
          }
        } catch (retryError) {
        }
      }
      return null;
    }
  };

  const captureAndUpload = async (captureType: string) => {
    try {
      const isAbsenceCapture = captureType.includes("absence");
      
      const imageData = await captureImage();
      if (!imageData) {
        if (isAbsenceCapture) {
          for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 250));
            const retryImageData = await captureImage();
            if (retryImageData) {
              const result = await uploadImageData(retryImageData, captureType);
              if (result) return result;
            }
          }
        }
        return;
      }
      
      const result = await uploadImageData(imageData, captureType);
      if (!result && isAbsenceCapture) {
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 250));
          const retryImageData = await captureImage();
          if (retryImageData) {
            const retryResult = await uploadImageData(retryImageData, captureType);
            if (retryResult) return retryResult;
          }
        }
      }
      return result;
    } catch (error) {
      console.error("Error in captureAndUpload:", error);
      const isAbsenceCapture = captureType.includes("absence");
      if (isAbsenceCapture) {
        try {
          for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const imageData = await captureImage();
            if (imageData) {
              const result = await uploadImageData(imageData, captureType);
              if (result) return result;
            }
          }
        } catch (retryError) {
          console.error("Retry failed for captureAndUpload:", retryError);
        }
      }
    }
  };

  useEffect(() => {
    if (!isInterviewStarted || !isRecording || interviewCompleted) return;

    const totalQuestions = questions.length;
    const midPoint = Math.floor(totalQuestions / 2);

    if (questionNo === 0 && !fixedScreenshotFlags.current.start) {
      fixedScreenshotFlags.current.start = true;
      captureAndUpload("fixed_start");
      
      eyeTransitionCaptureCount.current = 0;
      multiFaceCaptureCount.current = 0;
      cameraDisableCaptureCount.current = 0;
      prevEyeLeftCount.current = 0;
      prevEyeRightCount.current = 0;
      prevMultiFaceCount.current = 0;
      prevCameraDisableCount.current = 0;
      lastEyeCaptureTime.current = 0;
      lastMultiFaceCaptureTime.current = 0;
      lastCameraDisableCaptureTime.current = 0;
      fileKeysRef.current = [];
    }

    if (questionNo === midPoint && !fixedScreenshotFlags.current.mid && totalQuestions > 1) {
      fixedScreenshotFlags.current.mid = true;
      captureAndUpload("fixed_mid");
    }

    if (questionNo === totalQuestions - 1 && !fixedScreenshotFlags.current.end) {
      fixedScreenshotFlags.current.end = true;
      captureAndUpload("fixed_end");
    }
  }, [questionNo, isInterviewStarted, isRecording, interviewCompleted, questions.length]);

  useEffect(() => {
    if (!isInterviewStarted || !isRecording || interviewCompleted) return;

    const checkInterval = setInterval(() => {
      const currentLeftCount = detectionCounts.current.eye_left_count || 0;
      const currentRightCount = detectionCounts.current.eye_right_count || 0;

      const leftIncreased = currentLeftCount > prevEyeLeftCount.current;
      const rightIncreased = currentRightCount > prevEyeRightCount.current;

      if ((leftIncreased || rightIncreased) && eyeTransitionCaptureCount.current < 2) {
        const now = Date.now();
        const timeSinceLastCapture = now - lastEyeCaptureTime.current;

        if (timeSinceLastCapture >= MIN_CAPTURE_INTERVAL || lastEyeCaptureTime.current === 0) {
          const direction = leftIncreased ? "left" : "right";
          eyeTransitionCaptureCount.current++;
          prevEyeLeftCount.current = currentLeftCount;
          prevEyeRightCount.current = currentRightCount;
          lastEyeCaptureTime.current = now;
          captureAndUpload(`eye_transition_${direction}`);
        }
      } else {
        prevEyeLeftCount.current = currentLeftCount;
        prevEyeRightCount.current = currentRightCount;
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [isInterviewStarted, isRecording, interviewCompleted]);

  useEffect(() => {
    if (!isInterviewStarted || !isRecording || interviewCompleted) return;
    const interval = setInterval(() => {
      const currentCount = detectionCounts.current.multiple_face_detected_count || 0;

      if (currentCount > prevMultiFaceCount.current && multiFaceCaptureCount.current < 2) {
        const now = Date.now();
        const timeSinceLastCapture = now - lastMultiFaceCaptureTime.current;

        if (timeSinceLastCapture >= MIN_CAPTURE_INTERVAL || lastMultiFaceCaptureTime.current === 0) {
          multiFaceCaptureCount.current++;
          prevMultiFaceCount.current = currentCount;
          lastMultiFaceCaptureTime.current = now;
          captureAndUpload("multiface_detection");
        }
      } else {
        prevMultiFaceCount.current = currentCount;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isInterviewStarted, isRecording, interviewCompleted]);

  useEffect(() => {
    if (!isInterviewStarted || !isRecording || interviewCompleted) return;

    const currentCameraDisableCount = counts.video || 0;

    if (currentCameraDisableCount > prevCameraDisableCount.current && cameraDisableCaptureCount.current < 2) {
      const now = Date.now();
      const timeSinceLastCapture = now - lastCameraDisableCaptureTime.current;

      if (timeSinceLastCapture >= MIN_CAPTURE_INTERVAL || lastCameraDisableCaptureTime.current === 0) {
        cameraDisableCaptureCount.current++;
        prevCameraDisableCount.current = currentCameraDisableCount;
        lastCameraDisableCaptureTime.current = now;
        captureAndUpload("camera_disabled");
      }
    } else {
      prevCameraDisableCount.current = currentCameraDisableCount;
    }
  }, [counts.video, isInterviewStarted, isRecording, interviewCompleted]);

  const playIntro = async () => {
    if (introPlayedRef.current) return;

    if (interviewType === "MCQ") {
      setIsInterviewStarted(true);
      setTimer(0);
      startRec();
      return;
    }

    const isIOSDevice = isIOS();
    const isSafariBrowser = isSafari();

    if (isIOSDevice || isSafariBrowser) {
      try {
        introPlayedRef.current = true;
        const audio = new Audio();
        const introData = await getItemByIdIntroConclude(1, "intro_conclude");
        if (!introData?.data?.intro_blob) {
          throw new Error("Intro audio blob not found");
        }
        audio.src = URL.createObjectURL(introData.data.intro_blob as Blob);

        if (isIOSDevice) {
          audio.load();
        }

        let introAudioTime = await getDuration(interviewData?.intro_dailog_audio_url);
        setBotSpeechDuration(introAudioTime as number);
        setBotSpeechRendered(false);
        setTimeout(() => {
          setBotSpeechRendered(true);
        }, 1);

        if (pathname.includes("/source-device-mobile") || isIOSDevice) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((e) => {
              console.error("Mobile intro play failed:", e);
              document.addEventListener("click", () => audio.play(), { once: true });
            });
          }
        } else {
          await getSinkIdAndPlay(audio);
        }

        setTimeout(
          () => {
            if (isIOSDevice) {
              setIsIosInterview(true);
            } else {
              setIsInterviewStarted(true);
              setTimer(0);
              startRec();
            }
          },
          (introAudioTime as number) * 1000 + 1000
        );

        return () => {
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.src = "";
          }
        };
      } catch (err) {
        console.error("Error in playIntro:", err);
        setIsInterviewStarted(true);
        setTimer(0);
        startRec();
      }
    } else {
      const audio = new Audio();
      const introData = await getItemByIdIntroConclude(1, "intro_conclude");
      audio.src = URL.createObjectURL(introData?.data?.intro_blob as Blob);

      if (pathname.includes("/source-device-mobile")) {
        audio.play();
      } else {
        getSinkIdAndPlay(audio);
      }

      let introAudioTime = await getDuration(interviewData?.intro_dailog_audio_url);

      setBotSpeechDuration(introAudioTime as number);
      setBotSpeechRendered(false);
      setTimeout(() => {
        setBotSpeechRendered(true);
      }, 1);
      setTimeout(() => {
        startRec();
      }, (introAudioTime as number) * 1000);

      setTimeout(() => {
        setIsInterviewStarted(true);
        setTimer(0);
      }, (introAudioTime as number) * 1000 + 1000);
    }
  };

  const clearStorage = async () => {
    try {
      const checkBeforeData = await getAllItems();
      if (checkBeforeData?.length) {
        await deleteObject();
      }

      const record = await getItemByIdIntroConclude(1, "intro_conclude");
      if (record?.data) {
        deleteItemByIdIntroConclude(1, "intro_conclude");
      }
    } catch (err) {
      errPopper(err);
      console.error(err);
    }
  };

  const startSubmittingInterview = async ({ lastQuestionEndTime }: { lastQuestionEndTime: string }) => {
    try {
      isSubmittingRef.current = true;
      setSubmittingInterview(true);
      if (interviewCompleted) return;

      const now = Date.now();
      const updateIntervals = (intervals: { awayTime: number; inTime: number | null }[]) => {
        return intervals.map((interval) =>
          interval.inTime === null ? { ...interval, inTime: now } : interval
        );
      };

      const updatedVideoTimeIntervals = updateIntervals([...counts.videoTimeIntervals]);
      const updatedAudioTimeIntervals = updateIntervals([...counts.audioTimeIntervals]);
      const updatedTimeIntervals = updateIntervals([...counts.timeIntervals]);

      setCounts((prevCounts) => ({
        ...prevCounts,
        videoTimeIntervals: updatedVideoTimeIntervals,
        audioTimeIntervals: updatedAudioTimeIntervals,
        timeIntervals: updatedTimeIntervals,
      }));

      const lastQuestionTime = dayjs().toISOString();
      let questionAns = questionsWithTimeStamps;

      if (interviewType !== "MCQ" && questionNo > 0 && questionAns[questionNo - 1]) {
        questionAns[questionNo - 1].end_time = lastQuestionEndTime;
      }

      const firstQuesStartTime =
        interviewType === "MCQ"
          ? (interviewTimes?.firstQuestionTime?.toISOString() ?? dayjs().toISOString())
          : (questionsWithTimeStamps[0]?.start_time ?? dayjs().toISOString());

      const lastQuesEndTime =
        interviewType === "MCQ"
          ? (interviewTimes?.lastQuestionTime?.toISOString() ?? dayjs().toISOString())
          : (questionsWithTimeStamps[questionsWithTimeStamps.length - 1]?.end_time ?? lastQuestionEndTime);

      const questionResponses =
        interviewType === "MCQ"
          ? (questionAnswers || []).map((qa) => {
            const matchingQuestion = questions.find((q) => q.qtn === qa.qns);
            return {
              qtn: qa.qns,
              id: matchingQuestion?.id || "",
              c_ans: qa.c_answer,
              options: qa.options,
              difficulty: matchingQuestion?.difficulty,
            };
          })
          : questionAns
            .filter((qtn) => qtn.qtn && qtn.id)
            .map((qtn) => ({
              qtn: qtn.qtn,
              id: qtn.id,
              start_time: qtn.start_time,
              end_time: qtn.end_time,
              bot_start_time: qtn.bot_start_time,
              difficulty: qtn.difficulty,
            }));

      const totalDurationInMins =
        (new Date(lastQuesEndTime).getTime() - new Date(firstQuesStartTime).getTime()) / 1000 / 60;

      const calculateTotalTime = (intervals: any[]) => {
        return (
          Math.round(
            intervals.reduce(
              (acc, interval) =>
                acc + (interval.inTime !== null ? (interval.inTime - interval.awayTime) / 1000 : 0),
              0
            ) * 100
          ) / 100
        );
      };

      const totalTabSwitchingTime = calculateTotalTime(updatedTimeIntervals);
      const totalCameraDisablingTime = counts.video * 5;
      const totalMicMutingTime = calculateTotalTime(updatedAudioTimeIntervals);

      const calculateTotalEyeTime = (intervals: { inTime: number | null; awayTime: number }[]) =>
        Math.round(
          intervals.reduce(
            (acc, interval) =>
              acc + (interval.inTime !== null ? (interval.inTime - interval.awayTime) / 1000 : 0),
            0
          ) * 100
        ) / 100;

      const { eyeTimeIntervals } = detectionCounts.current;

      let bestFileKey = null;
      for (let i = fileKeysRef.current.length - 1; i >= 0; i--) {
        if (fileKeysRef.current[i] && fileKeysRef.current[i].includes('absence')) {
          bestFileKey = fileKeysRef.current[i];
          break;
        }
      }
      
      if (!bestFileKey && fileKeysRef.current.length > 0) {
        bestFileKey = fileKeysRef.current[fileKeysRef.current.length - 1];
      }
      
      const screenshotPayload = bestFileKey ? { candidate_screenshots_path: bestFileKey } : {}; 

      const payload = {
        duration: Math.abs(Math.ceil(totalDurationInMins)),
        interview_date: lastQuestionTime,
        auth_token: videoSDKToken,
        room_id: meetingId,
        qtn_ans: questionResponses,
        total_qtns: interviewType === "MCQ" ? questionAnswers?.length || 0 : questionAns.filter((qtn) => qtn.qtn && qtn.id).length,
        proctoring_activity_count: {
          tab_switching_count: counts.leaveCount,
          user_absence_count: 0,
          disable_cam_count: counts.video,
          disable_mic_count: counts.audio,
          total_tab_switching_time: totalTabSwitchingTime,
          total_camera_disabling_time: totalCameraDisablingTime,
          total_mic_muting_time: totalMicMutingTime,
          eye_right_count: detectionCounts.current.eye_right_count,
          eye_left_count: detectionCounts.current.eye_left_count,
          eye_up_count: detectionCounts.current.eye_up_count,
          eye_down_count: detectionCounts.current.eye_down_count,
          total_eye_right_time: calculateTotalEyeTime(eyeTimeIntervals.right),
          total_eye_left_time: calculateTotalEyeTime(eyeTimeIntervals.left),
          total_eye_up_time: calculateTotalEyeTime(eyeTimeIntervals.up),
          total_eye_down_time: calculateTotalEyeTime(eyeTimeIntervals.down),
          multiple_face_detected: detectionCounts.current.multiple_face_detected_count >= 1,
          multiple_face_detected_count: detectionCounts.current.multiple_face_detected_count,
          multiple_face_detected_time: calculateTotalEyeTime(eyeTimeIntervals.multiFaces),
        },
        meeting_room_id: meetingId,
        ...screenshotPayload,
      };

      const response = await saveInterviewAPI({
        payload,
        interviewId: interview_id as string,
        candidateCode: candidate_code as string,
      });

      if (response.status == 200 || response.status == 201) {
        setInterviewCompleted(true);
        setSubmitError(false);
        if (isRecording) {
          stopRecording();
        }

        fileKeysRef.current = [];

        await clearStorage();
        successPopper(response?.data?.message);
        setTimeout(() => {
          let url = `/join-interview/${interview_id}/candidate/${candidate_code}/rating-review?`;
          if (counts.video >= 3 || videoStreamOff) {
            url = `/join-interview/${interview_id}/candidate/${candidate_code}/rating-review?endCall=${endCall}`;
          }
          window.location.replace(url);
        }, 1000);
      } else {
        throw response;
      }
    } catch (err) {
      setSubmitError(true);
      errPopper(err);
    } finally {
      isSubmittingRef.current = false;
      setSubmittingInterview(false);
    }
  };

  const audioDataRef = useRef<HTMLAudioElement | null>(null);

  const preloadFirstQuestionAudio = async (): Promise<void> => {
    if (!questions?.[0]?.qtn_audio_url || preloadedFirstQuestionAudio) {
      return;
    }

    const maxAttempts = MAX_AUDIO_PRELOAD_ATTEMPTS;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = questions[0].qtn_audio_url;

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Audio preload timeout on attempt ${attempt}`));
          }, 3000);

          const onCanPlayThrough = () => {
            clearTimeout(timeout);
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('error', onError);
            resolve(audio);
          };

          const onError = (e: Event) => {
            clearTimeout(timeout);
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('error', onError);
            reject(e);
          };

          audio.addEventListener('canplaythrough', onCanPlayThrough);
          audio.addEventListener('error', onError);

          audio.load();
        });

        try {
          await audio.play();
          audio.pause();
          audio.currentTime = 0;

          setPreloadedFirstQuestionAudio(audio);
          setAudioPreloadAttempts(attempt);
          return;

        } catch (playError) {
          console.error(`Audio play test failed on attempt ${attempt}:`, playError);
          if (attempt === maxAttempts) {
            throw playError;
          }
        }

      } catch (error) {
        console.error(`Audio preload attempt ${attempt} failed:`, error);
        if (attempt === maxAttempts) {
          console.error("All audio preload attempts failed, will try fallback during playback");
          setAudioPreloadAttempts(attempt);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const onIOSPlayClick: OnIOSPlayClickType = async (audio, event) => {
    try {
      setUserInteractionCaptured(true);
      if (audio) {
        try {
          await audio.play();
        } catch (e) {
          console.error("Intro audio play failed:", e);
        }
      }

      await preloadFirstQuestionAudio();

      setIsInterviewStarted(true);
      setTimer(0);
      startRec();
      setIsIosInterview(false);

    } catch (error) {
      console.error("onIOSPlayClick error:", error);
      setIsInterviewStarted(true);
      setTimer(0);
      startRec();
      setIsIosInterview(false);
    }
  };

  const playAudioFromQuestions = async () => {
    setShowNextButtonOrNot(false);
    setTimer1(false);

    if (questionNo >= questions.length || !isInterviewStarted) {
      return;
    }

    if (interviewType === "MCQ" && currentStage === "questions") {
      setShowNextButtonOrNot(true);
      if (!countdownRef.current) {
        setTimer1(true);
        startCountdown();
      }
      return;
    }

    const isIOSDevice = isIOS();
    const isSafariBrowser = isSafari();

    if (isIOSDevice || isSafariBrowser) {
      try {
        await getDurationByQuestionAudio();

        let audio: HTMLAudioElement;

        if (questionNo === 0 && preloadedFirstQuestionAudio && userInteractionCaptured) {
          audio = preloadedFirstQuestionAudio;
          currentAudioRef.current = audio;
          audioDataRef.current = audio;
          audio.currentTime = 0;
        } else {
          audio = new Audio();
          currentAudioRef.current = audio;
          audioDataRef.current = audio;

          const audioSrc = questions[questionNo]?.audio || questions[questionNo]?.qtn_audio_url;

          if (audioSrc) {
            const blobUrl = typeof audioSrc === "string" ? audioSrc : URL.createObjectURL(audioSrc);
            audio.src = blobUrl;

            if (isIOSDevice) {
              audio.load();
              await new Promise((resolve) => {
                const checkReady = () => {
                  if (audio.readyState >= 2) {
                    resolve(audio);
                  } else {
                    setTimeout(checkReady, 50);
                  }
                };
                setTimeout(checkReady, 100);
              });
            }
          }
        }

        const duration: any = await getDuration(questions[questionNo]?.qtn_audio_url);

        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setShowNextButtonOrNot(true);
          setRenderTypeWriter(true);
        };

        if (isIOSDevice || pathname.includes("/source-device-mobile")) {
          const attemptPlay = async (retryCount = 0) => {
            try {
              if (questionNo === 0 && userInteractionCaptured) {
                await audio.play();
              } else {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                  await playPromise;
                }
              }
            } catch (e) {
              console.error("iOS audio play failed:", e, "Retry count:", retryCount);

              if (retryCount < 2 && questionNo === 0) {
                setTimeout(() => attemptPlay(retryCount + 1), 200);
              } else {
                setShowNextButtonOrNot(true);
                setRenderTypeWriter(true);
              }
            }
          };

          await attemptPlay();
        } else {
          await getSinkIdAndPlay(audio);
        }

        setRenderTypeWriter(true);
        const safariDelayMultiplier = isSafariBrowser ? 1.2 : 1;

        setTimeout(() => {
          setShowNextButtonOrNot(true);
        }, duration * 1000 * safariDelayMultiplier + 2000);

        if (interviewType !== "MCQ") {
          setTimeout(() => {
            setTimer1(true);
            startCountdown();
          }, duration * 1000 * safariDelayMultiplier);
        }

        const timeStamp = dayjs().toISOString();
        const botStartTime = dayjs().toISOString();
        setQuestionsWithTimeStamps((prev) => {
          const newQuestion = {
            qtn: questions[questionNo]?.qtn,
            start_time: timeStamp,
            end_time: "",
            bot_start_time: botStartTime,
            id: questions[questionNo]?.id,
            difficulty: questions[questionNo]?.difficulty,
          };
          return questionNo === 0 ? [newQuestion] : [...prev, newQuestion];
        });

      } catch (err) {
        console.error("Error in playAudioFromQuestions:", err);
        setRenderTypeWriter(true);
        setShowNextButtonOrNot(true);
      }
    } else {
      getDurationByQuestionAudio();
      let duration: any = await getDuration(questions[questionNo]?.qtn_audio_url);

      if (questionNo !== questions.length) {
        setTimeout(() => {
          setShowNextButtonOrNot(true);
        }, duration * 1000 + 2000);
        setTimeout(() => {
          if (interviewType != "MCQ") {
            setTimer1(true);
            startCountdown();
          }
        }, duration * 1000);
      }

      if (questionNo == 0) {
        const timeOfStart = dayjs().toISOString();
        const botStartTimeFirst = dayjs().toISOString();
        setQuestionsWithTimeStamps([
          {
            qtn: questions[0]?.qtn,
            start_time: timeOfStart,
            end_time: "",
            id: questions[0]?.id,
            difficulty: questions[questionNo]?.difficulty,
            bot_start_time: botStartTimeFirst,
          },
        ]);
        const audio = new Audio();

        if (questions[questionNo]?.audio || questions[questionNo]?.qtn_audio_url) {
          audio.src = URL.createObjectURL(questions[questionNo]?.audio || questions[questionNo]?.qtn_audio_url || "");
        }
        if (pathname.includes("/source-device-mobile")) {
          audio.play();
        } else {
          getSinkIdAndPlay(audio);
        }
      } else {
        const timeOfQuestion = dayjs().toISOString();
        const botStartTimeNext = dayjs().toISOString();
        let tempQuestions = [...questionsWithTimeStamps];
        const presentQuestion = {
          qtn: questions[questionNo]?.qtn,
          start_time: timeOfQuestion,
          end_time: "",
          bot_start_time: botStartTimeNext,
          id: questions[questionNo]?.id,
          difficulty: questions[questionNo]?.difficulty,
        };
        tempQuestions = [...tempQuestions, presentQuestion];

        setQuestionsWithTimeStamps(tempQuestions);
        const audio = new Audio();

        if (questions[questionNo]?.qtn_audio_url || questions[questionNo]?.audio) {
          audio.src = URL.createObjectURL(questions[questionNo]?.audio || questions[questionNo]?.qtn_audio_url || "");
        }
        if (pathname.includes("/source-device-mobile")) {
          audio.play();
        } else {
          getSinkIdAndPlay(audio);
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      if (preloadedFirstQuestionAudio) {
        preloadedFirstQuestionAudio.pause();
        preloadedFirstQuestionAudio.currentTime = 0;
        preloadedFirstQuestionAudio.src = "";
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const [isTimerCompleted, setIsTimerCompleted] = useState(false);

  const startCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    const currentTime = randomTimes[questionNo];
    setRemainingTime(currentTime);

    countdownRef.current = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime === 1) {
          if (countdownRef.current !== null) {
            clearInterval(countdownRef.current);
          }
          if (interviewType === "MCQ") {
            if (questionNo === questions.length - 1) {
              if (!isSubmittingRef.current && !interviewCompleted && !submittingInterview) {
                submitInterviewForTesting();
              }
              return 0;
            } else {
              startTheNextQuestion();
              return 0;
            }
          }
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
            currentAudioRef.current = null;
          }
          if (isSafari() && !isIOS()) {
            if (interviewType === "MCQ" && questionNo === questions.length - 1) {
              if (!isSubmittingRef.current && !interviewCompleted && !submittingInterview) {
                submitInterviewForTesting();
              }
              return 0;
            } else {
              startTheNextQuestion();
              return randomTimes[(questionNo + 1) % randomTimes.length];
            }
          }
          if (isIOS()) {
            setIsTimerCompleted(true);
            setShowNextButtonOrNot(true);
            return 0;
          }
          if (interviewType === "MCQ" && questionNo === questions.length - 1) {
            if (!isSubmittingRef.current && !interviewCompleted && !submittingInterview) {
              submitInterviewForTesting();
            }
            return 0;
          } else {
            startTheNextQuestion();
            return randomTimes[(questionNo + 1) % randomTimes.length];
          }
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const handleManualNextQuestion = () => {
    if (isTimerCompleted) {
      setIsTimerCompleted(false);

      if (questionNo < questions.length) {
        setQuestionsWithTimeStamps((prev) => {
          const updated = [...prev];
          if (updated[questionNo]) {
            updated[questionNo].end_time = dayjs().toISOString();
          }
          return updated;
        });
      }

      startTheNextQuestion();
    } else {
      startTheNextQuestion();
    }
  };

  const [countQuestion, setCountQuestion] = useState(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const isIOSDevice = isIOS();
    const isSafariBrowser = isSafari();

    if (isIOSDevice || isSafariBrowser) {
      setRenderTypeWriter(false);
      const timer = setTimeout(() => {
        if (countQuestion > 0) {
          playAudioFromQuestions();
        } else {
          setRenderTypeWriter(true);
          playAudioFromQuestions();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setRenderTypeWriter(false);
      setTimeout(() => {
        setRenderTypeWriter(true);
      }, 1);

      if (countQuestion) {
        playAudioFromQuestions();
      }
    }
  }, [countQuestion, questionNo]);

  useEffect(() => {
    if (!isRecording || !isInterviewStarted) return;

    let presentQuestions = [...questionsWithTimeStamps];
    let presentQuestion = presentQuestions[questionNo - 1];

    if (presentQuestion) {
      presentQuestion.end_time = dayjs().toISOString();
      presentQuestions[questionNo - 1] = presentQuestion;
      setQuestionsWithTimeStamps(presentQuestions);
    }

    setCountQuestion((prev) => prev + 1);
  }, [questions[questionNo], isInterviewStarted, isRecording]);

  const [lastQuestionEnd, setLastQuestionEnd] = useState("");

  const playConclude = async (): Promise<void> => {
    setShowNextButtonOrNot(false);
    setIsInterviewCompleted(true);

    setRenderTypeWriter(false);

    const audio = new Audio();
    const introData: any = await getItemByIdIntroConclude(1, "intro_conclude");
    audio.src = URL.createObjectURL(introData?.data?.conclude_blob as Blob);

    if (pathname.includes("/source-device-mobile")) {
      audio.play();
    } else {
      getSinkIdAndPlay(audio);
    }

    let concludeAudioTime = await getDuration(interviewData?.conclude_dailog_audio_url);
    setBotSpeechDuration(concludeAudioTime as number);

    setBotSpeechRendered(false);
    setTimeout(() => {
      setBotSpeechRendered(true);

      setTimeout(() => {
        setRenderTypeWriter(true);
      }, 100);
    }, 1);

    let lastQuestionEndTime = dayjs().toISOString();
    setLastQuestionEnd(lastQuestionEndTime);

    setTimeout(
      () => {
        startSubmittingInterview({ lastQuestionEndTime });
        setIsInterviewCompleted(true);
      },
      (concludeAudioTime as number) * 1000 + 2000
    );
  };

  const submitInterviewForTesting = () => {
    startSubmittingInterview({
      lastQuestionEndTime: lastQuestionEnd,
    });
  };

  useEffect(() => {
    if (isInterviewStarted && questions.length && questionNo >= questions.length) {
      setQuestions([]);
      playConclude();
    }
  }, [questionNo, isInterviewStarted]);

  useEffect(() => {
    if (isSafari() || isIOS()) {
      let cleanupFn: (() => void) | undefined;
      playIntro().then((cleanup) => {
        cleanupFn = cleanup;
      });
      return () => {
        if (cleanupFn) cleanupFn();
      };
    } else {
      playIntro();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const submitStoredInterview = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    if (endCall || isDurationCompleted) {
      const parsedData = {
        questionsWithTimeStamps,
        detectionCounts: detectionCounts.current,
        lastQuestionEnd,
        currentQuestionNumber: questionNo,
        timestamp123: new Date().toISOString(),
      };

      let interviewQuestions = parsedData.questionsWithTimeStamps || [];
      while (
        interviewQuestions.length > 0 &&
        interviewQuestions[interviewQuestions.length - 1].end_time === ""
      ) {
        interviewQuestions[interviewQuestions.length - 1].end_time = parsedData.timestamp123;
      }

      const remainingQuestions = questions
        .slice(interviewQuestions.length)
        .map((qtn) => ({
          qtn: qtn.qtn,
          id: qtn.id,
          start_time: parsedData.timestamp123,
          end_time: parsedData.timestamp123,
          bot_start_time: parsedData.timestamp123,
          difficulty: qtn.difficulty,
        }));

      const allQuestions = [...interviewQuestions, ...remainingQuestions];

      const startSubmittingInterview2 = async () => {
        try {
          isSubmittingRef.current = true;
          setSubmittingInterview(true);
          if (interviewCompleted) return;
          const now = Date.now();
          const updateIntervals = (intervals: { awayTime: number; inTime: number | null }[]) => {
            return intervals.map((interval) =>
              interval.inTime === null ? { ...interval, inTime: now } : interval
            );
          };

          const updatedVideoTimeIntervals = updateIntervals([...counts.videoTimeIntervals]);
          const updatedAudioTimeIntervals = updateIntervals([...counts.audioTimeIntervals]);
          const updatedTimeIntervals = updateIntervals([...counts.timeIntervals]);

          setCounts((prevCounts) => ({
            ...prevCounts,
            videoTimeIntervals: updatedVideoTimeIntervals,
            audioTimeIntervals: updatedAudioTimeIntervals,
            timeIntervals: updatedTimeIntervals,
          }));

          const lastQuestionTime = dayjs().toISOString();

          const firstQuesStartTime = allQuestions[0].start_time;
          const lastQuesEndTime = allQuestions[allQuestions.length - 1].end_time || lastQuestionTime;
          const totalDurationInMins = (new Date(lastQuesEndTime).getTime() - new Date(firstQuesStartTime).getTime()) / 1000 / 60;

          const calculateTotalTime = (intervals: any[]) => {
            return (
              Math.round(
                intervals.reduce(
                  (acc, interval) =>
                    acc + (interval.inTime !== null ? (interval.inTime - interval.awayTime) / 1000 : 0),
                  0
                ) * 100
              ) / 100
            );
          };

          const totalTabSwitchingTime = calculateTotalTime(updatedTimeIntervals);
          const totalCameraDisablingTime = counts.video * 5;
          const totalMicMutingTime = calculateTotalTime(updatedAudioTimeIntervals);

          const calculateTotalEyeTime = (intervals: { inTime: number | null; awayTime: number }[]) =>
            Math.round(
              intervals.reduce(
                (acc, interval) =>
                  acc + (interval.inTime !== null ? (interval.inTime - interval.awayTime) / 1000 : 0),
                0
              ) * 100
            ) / 100;

          const { eyeTimeIntervals } = detectionCounts.current;
          
          const lastFileKey = fileKeysRef.current.length > 0 ? fileKeysRef.current[fileKeysRef.current.length - 1] : null;
          const screenshotPayload = lastFileKey ? { candidate_screenshots_path: lastFileKey } : {};

          const payload = {
            duration: Math.abs(Math.ceil(totalDurationInMins)),
            interview_date: lastQuestionTime,
            auth_token: videoSDKToken,
            room_id: meetingId,
            qtn_ans: allQuestions
              .filter((qtn) => qtn.qtn && qtn.id)
              .map((qtn) => ({
                qtn: qtn.qtn,
                id: qtn.id,
                start_time: qtn.start_time,
                end_time: qtn.end_time,
                bot_start_time: qtn.bot_start_time,
                difficulty: qtn.difficulty,
              })),
            total_qtns: allQuestions.filter((qtn) => qtn.qtn && qtn.id).length,
            proctoring_activity_count: {
              tab_switching_count: counts.leaveCount,
              disable_cam_count: counts.video,
              disable_mic_count: counts.audio,
              total_tab_switching_time: totalTabSwitchingTime,
              total_camera_disabling_time: totalCameraDisablingTime,
              total_mic_muting_time: totalMicMutingTime,
              eye_right_count: detectionCounts.current.eye_right_count,
              eye_left_count: detectionCounts.current.eye_left_count,
              eye_up_count: detectionCounts.current.eye_up_count,
              eye_down_count: detectionCounts.current.eye_down_count,
              total_eye_right_time: calculateTotalEyeTime(eyeTimeIntervals.right),
              total_eye_left_time: calculateTotalEyeTime(eyeTimeIntervals.left),
              total_eye_up_time: calculateTotalEyeTime(eyeTimeIntervals.up),
              total_eye_down_time: calculateTotalEyeTime(eyeTimeIntervals.down),
              multiple_face_detected: detectionCounts.current.multiple_face_detected_count >= 1,
              multiple_face_detected_count: detectionCounts.current.multiple_face_detected_count,
              multiple_face_detected_time: calculateTotalEyeTime(eyeTimeIntervals.multiFaces),
            },
            meeting_room_id: meetingId,
            ...screenshotPayload,
          };

          const response = await saveInterviewAPI({
            payload,
            interviewId: interview_id as string,
            candidateCode: candidate_code as string,
          });

          if (response.status == 200 || response.status == 201) {
            setInterviewCompleted(true);

            if (isRecording) {
              stopRecording();
            }
            
            fileKeysRef.current = [];
            
            successPopper(response?.data?.message);

            await clearStorage();
            setTimeout(() => {
              let url = `/join-interview/${interview_id}/candidate/${candidate_code}/rating-review?`;
              if (counts.video >= 3 || videoStreamOff) {
                url = `/join-interview/${interview_id}/candidate/${candidate_code}/rating-review?endCall=${endCall}`;
              }
              window.location.replace(url);
            }, 1000);
          } else {
            throw response;
          }
        } catch (err) {
          setSubmitError(true);
          errPopper(err);
        } finally {
          isSubmittingRef.current = false;
          setSubmittingInterview(false);
        }
      };

      startSubmittingInterview2();
    }
  };

  if (counts.video >= 3 || videoStreamOff) {
    setEndCall && setEndCall(true);
  }

  useEffect(() => {
    const isValidDuration = interviewData?.duration && interviewData.duration > 0;
    if (!isValidDuration) return;

    const timeoutId = setTimeout(
      () => {
        setIsDurationCompleted(true);
      },
      interviewData.duration * 60 * 1000
    );

    return () => clearTimeout(timeoutId);
  }, [joined, interviewData?.duration]);

  useEffect(() => {
    if (endCall || isDurationCompleted) {
      if (!isSubmittingRef.current && !interviewCompleted && !submittingInterview) {
        if (interviewType === "MCQ") {
          submitInterviewForTesting();
        } else {
          submitStoredInterview();
        }
      }
    }
  }, [endCall, currentStage, isRecording, isDurationCompleted]);

  return {
    renderTypeWriter: renderTypeWriter as boolean,
    isRedirecting: isRedirecting as boolean,
    showNextButtonOrNot: showNextButtonOrNot,
    submittingInterview,
    submitInterviewForTesting,
    submitError,
    detectionCounts,
    timer1,
    remainingTime,
    setCountQuestion,
    playAudioFromQuestions,
    setTimer1,
    countdownRef,
    isIosInterview,
    onIOSPlayClick,
    audioDataRef,
    isTimerCompleted,
    handleManualNextQuestion,
  };
};

export default useQuestionsHook;