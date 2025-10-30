import {
  deleteItemByIdIntroConclude,
  getItemByIdIntroConclude,
} from "@/helpers/indexedDBIntroConclude";
import { deleteObject, getAllItems } from "@/helpers/indexedDBQuestions";
import { errPopper } from "@/helpers/popper/errPopper";
import { successPopper } from "@/helpers/popper/successPopper";
import { interviewUserImagesAPI, saveInterviewAPI } from "@/https/services/interviews";
import { IQuesTime } from "@/lib/interfaces/interviews";
import {
  IQuestioningBlock,
  IUseQuestionHookReturnType,
  OnIOSPlayClickType,
} from "@/lib/interfaces/meeting";
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
  const [botStartTime, setBotStartTime] = useState<string>("");
  const { stopRecording, changeMic, localParticipant } = useMeeting();
  const [timer1, setTimer1] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const randomTimes = useMemo(
    () => questions.map((q) => Number(q.time_limit) || 0),
    [questions]
  );

  const [isIosInterview, setIsIosInterview] = useState(false);
  const [userInteractionCaptured, setUserInteractionCaptured] = useState(false);
  const [preloadedFirstQuestionAudio, setPreloadedFirstQuestionAudio] = useState<HTMLAudioElement | null>(null);
  const [audioPreloadAttempts, setAudioPreloadAttempts] = useState(0);
  const [isTimerCompleted, setIsTimerCompleted] = useState(false);
  const MAX_AUDIO_PRELOAD_ATTEMPTS = 3;
  const isSubmittingRef = useRef(false);
  const [botMediaRecorder, setBotMediaRecorder] = useState<MediaRecorder | null>(null);
  const [botAudioChunks, setBotAudioChunks] = useState<Blob[]>([]);
  const botAudioStreamRef = useRef<MediaStream | null>(null);
  const recordingStartedRef = useRef(false);
  const isInitializingRecorderRef = useRef(false);
  const userMicStreamRef = useRef<MediaStream | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sharedAudioContextRef = useRef<AudioContext | null>(null);
  const sharedDestinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const videoSDKRecordingStartedRef = useRef(false);

  const isRecordingRef = useRef<boolean>(isRecording);
  const introPlayedRef = useRef(false);
  const isPlayingAudioRef = useRef(false);
  const [countdownEnded, setCountdownEnded] = useState(false);
  const countdownActionRef = useRef<"submit" | "next" | null>(null);
  const concludeStartedRef = useRef<boolean>(false);

  const [isInDelayPeriod, setIsInDelayPeriod] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);

  const [countQuestion, setCountQuestion] = useState(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const questionPlayedRef = useRef<Set<number>>(new Set());

  const [lastQuestionEnd, setLastQuestionEnd] = useState("");
  const audioDataRef = useRef<HTMLAudioElement | null>(null);

  const multiFaceCaptureCount = useRef(0);
  const eyeTransitionCaptureCount = useRef(0);
  const userAbsenceCaptureCount = useRef(0);

  const multiFaceDetectionCount = useRef(0);
  const eyeTransitionDetectionCount = useRef(0);
  const userAbsenceDetectionCount = useRef(0);

  const fixedScreenshotFlags = useRef({
    start: false,
    mid: false,
    end: false
  });

  const currentMultiFaceState = useRef(false);
  const currentUserAbsenceState = useRef(false);
  const noFaceDetectedStartTime = useRef<number | null>(null);
  const hasPreCaptured = useRef(false);

  const lastEyeCaptureTime = useRef<number>(0);
  const lastMultiFaceCaptureTime = useRef<number>(0);
  const lastAbsenceCaptureTime = useRef<number>(0);

  const prevEyeLeftCount = useRef(0);
  const prevEyeRightCount = useRef(0);

  const MIN_CAPTURE_INTERVAL = 1000;
  const COOLDOWN_MS = 1000;
  const MAX_CAPTURES = 2;

  const fileKeysRef = useRef<string[]>([]);
  const multiFaceIntervalRef = useRef<{ startTime: number; endTime: number | null }[]>([]);
  const userAbsenceIntervalRef = useRef<{ startTime: number; endTime: number | null }[]>([]);

  const questionsStarted = useRef(false);
  const nextButtonShownRef = useRef(false);

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

  const hasTimer = (qNo: number): boolean => {
    const q = questions[qNo];
    if (!q) return false;
    const timer = Number(q.time_limit) || 0;
    return timer > 0;
  };

  const setQuestionEndTime = (questionIndex: number) => {
    setQuestionsWithTimeStamps((prev) => {
      const updated = [...prev];
      if (updated[questionIndex] && !updated[questionIndex].end_time) {
        const endTime = dayjs().toISOString();
        updated[questionIndex].end_time = endTime;
        const duration = ((new Date(endTime).getTime() - new Date(updated[questionIndex].start_time).getTime()) / 1000).toFixed(2);
      }
      return updated;
    });
  };

  const onUserGesture = async () => {
    if (sharedAudioContextRef.current && sharedAudioContextRef.current.state === 'suspended') {
      try {
        await sharedAudioContextRef.current.resume();
      } catch (e) {
        console.warn('AudioContext resume failed:', e);
      }
    }
  };

  useEffect(() => {
    nextButtonShownRef.current = false;
  }, [questionNo]);

  const showNextButton = () => {
    if (!nextButtonShownRef.current) {
      setShowNextButtonOrNot(true);
      nextButtonShownRef.current = true;
    }
  };

  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (interviewType !== "MCQ") {
      setTimer1(false);
    } else {
      if (countdownActionRef.current === "next" || countdownActionRef.current === "submit") {
        setTimer1(false);
        setRemainingTime(0);
      } else {
        setTimer1(hasTimer(questionNo));
      }
    }
    countdownActionRef.current = null;
    setCountdownEnded(false);
  }, [questionNo, interviewType, questions]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const waitUntilRecordingStarted = async (timeoutMs = 5000): Promise<boolean> => {
    const start = Date.now();
    return new Promise((resolve) => {
      const tick = () => {
        if (isRecordingRef.current) return resolve(true);
        if (Date.now() - start >= timeoutMs) return resolve(false);
        setTimeout(tick, 100);
      };
      tick();
    });
  };

  const initializeBotAudioRecording = async () => {
    try {
      if (botMediaRecorder) {
        try {
          botMediaRecorder.stop();
        } catch { }
        setBotMediaRecorder(null);
      }

      if (sharedAudioContextRef.current) {
        try {
          sharedAudioContextRef.current.close();
        } catch { }
        sharedAudioContextRef.current = null;
        sharedDestinationNodeRef.current = null;
      }

      const audioContext: AudioContext = new ((window as any).AudioContext ||
        (window as any).webkitAudioContext)();
      await audioContext.resume();

      const destination = audioContext.createMediaStreamDestination();
      sharedAudioContextRef.current = audioContext;
      sharedDestinationNodeRef.current = destination;
      botAudioStreamRef.current = destination.stream;

      try {
        const userMic = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } as any,
        });
        userMicStreamRef.current = userMic;
        const micSource = audioContext.createMediaStreamSource(userMic);
        micSource.connect(destination);
        micSourceNodeRef.current = micSource;
      } catch (micErr) {
        console.error("[AudioInit] Failed to capture participant mic for recording:", micErr);
      }

      setBotAudioChunks([]);

      try {
        (window as any).__injectedMixedMicActive = true;
        (window as any).__injectedMixedMicStreamId = (destination.stream as any)?.id;
        await changeMic(destination.stream as unknown as MediaStream);
      } catch (e) {
        console.error("[AudioInit] Failed to inject mixed stream as mic:", e);
      }

      const recorder = new MediaRecorder(destination.stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/mp4",
        audioBitsPerSecond: 128000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setBotAudioChunks((prev) => [...prev, event.data]);
        }
      };

      setBotMediaRecorder(recorder);
      recordingStartedRef.current = true;

      try {
        recorder.start(1000);
      } catch (startError) {
        recordingStartedRef.current = false;
        setBotMediaRecorder(null);
        throw startError;
      }
    } catch (error) {
      console.error("[AudioInit] Failed to initialize bot audio recording:", error);
      recordingStartedRef.current = false;
    } finally {
      isInitializingRecorderRef.current = false;
    }
  };

  const stopBotAudioRecording = () => {
    if (botMediaRecorder && botMediaRecorder.state !== "inactive") {
      botMediaRecorder.stop();
    }
    try {
      changeMic("");
      (window as any).__injectedMixedMicActive = false;
      (window as any).__injectedMixedMicStreamId = undefined;
    } catch (e) {
      console.error("[AudioStop] Error reverting mic on stop:", e);
    }
    if (botAudioStreamRef.current) {
      botAudioStreamRef.current.getTracks().forEach((track) => track.stop());
      botAudioStreamRef.current = null;
    }
    try {
      if (micSourceNodeRef.current) {
        try {
          micSourceNodeRef.current.disconnect();
        } catch { }
        micSourceNodeRef.current = null;
      }
      if (userMicStreamRef.current) {
        userMicStreamRef.current.getTracks().forEach((track) => track.stop());
        userMicStreamRef.current = null;
      }
    } catch (e) {
      console.error("[AudioStop] Error cleaning up mic stream after recording stop:", e);
    }
    recordingStartedRef.current = false;
    setBotMediaRecorder(null);
    setBotAudioChunks([]);
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

  const playWithInjection = async (audio: HTMLAudioElement) => {
    let cleanedUp = false;
    let botAudioSource: MediaElementAudioSourceNode | null = null;

    const cleanup = async () => {
      if (cleanedUp) return;
      cleanedUp = true;
      try {
        if (botAudioSource) {
          botAudioSource.disconnect();
          botAudioSource = null;
        }
      } catch (e) {
        console.error("[AudioPlayback] Error cleaning up audio source:", e);
      }
    };

    try {
      if (!isIOS() && "setSinkId" in audio) {
        try {
          await (audio as any).setSinkId(selectedSpeakerInMeet);
        } catch (e) {
          console.error("[AudioPlayback] setSinkId failed:", e);
        }
      }

      const audioContext = sharedAudioContextRef.current;
      const destination = sharedDestinationNodeRef.current;

      if (!audioContext || !destination) {
        throw new Error("Shared AudioContext not initialized");
      }

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      botAudioSource = audioContext.createMediaElementSource(audio);
      botAudioSource.connect(destination);
      botAudioSource.connect(audioContext.destination);

      audio.playbackRate = 0.95;

      const playPromise = audio.play();
      if (playPromise !== undefined) await playPromise;

      await new Promise<void>((resolve) => {
        const onEnded = () => {
          audio.removeEventListener("ended", onEnded);
          resolve();
        };
        audio.addEventListener("ended", onEnded);
      });
    } catch (e) {
      console.error("[AudioPlayback] Injection playback failed:", e);
      audio.playbackRate = 0.85;
      await audio.play();
    } finally {
      await cleanup();
    }
  };

  const playIntro = async () => {
    if (introPlayedRef.current) return;
    introPlayedRef.current = true;

    if (!recordingStartedRef.current) {
      await initializeBotAudioRecording();
      if (botMediaRecorder && botMediaRecorder.state !== "inactive") {
        botMediaRecorder.stop();
      }
      recordingStartedRef.current = false;
    }

    if (interviewType === "MCQ") {
      setIsInterviewStarted(true);
      setTimer(0);
      startRec();
      videoSDKRecordingStartedRef.current = true;

      const isSafariBrowser = isSafari();
      const isIOSDevice = isIOS();

      if (isSafariBrowser || isIOSDevice) {
        setTimeout(async () => {
          const started = await waitUntilRecordingStarted(10000);
          if (started) {
            questionsStarted.current = true;
            setTimeout(() => {
              if (!questionPlayedRef.current.has(0)) {
                setCountQuestion(1);
              }
            }, 200);
          } else {
            questionsStarted.current = true;
            setTimeout(() => {
              if (!questionPlayedRef.current.has(0)) {
                setCountQuestion(1);
              }
            }, 300);
          }
        }, 800);
      } else {
        waitUntilRecordingStarted().then((started) => {
          if (started) {
            questionsStarted.current = true;
            setBotSpeechRendered(false);
            setRenderTypeWriter(false);
            setTimeout(() => {
              setRenderTypeWriter(true);
              setTimeout(() => {
                setBotSpeechRendered(true);
                setCountQuestion((prev) => prev + 1);
              }, 50);
            }, 50);
          }
        });
      }
      return;
    }

    const isIOSDevice = isIOS();
    const isSafariBrowser = isSafari();

    try {
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

      if (isIOSDevice) {
        setBotSpeechRendered(false);
        setRenderTypeWriter(false);
        await new Promise((resolve) => setTimeout(resolve, 50));
        setRenderTypeWriter(true);
        setBotSpeechRendered(true);

        if (pathname.includes("/source-device-mobile") || isIOSDevice) {
          const playPromise = (async () => {
            try {
              await playWithInjection(audio);
            } catch (e) {
              console.error('Audio playback failed:', e);
              await audio.play();
            }
          })();
          if (playPromise !== undefined) {
            playPromise.catch((e) => {
              document.addEventListener("click", () => audio.play(), { once: true });
            });
          }
        } else {
          await playWithInjection(audio);
        }

        setTimeout(() => {
          setIsInterviewStarted(true);
          setIsIosInterview(true);
        }, (introAudioTime as number) * 1000);

        return () => {
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.src = "";
          }
        };
      } 
      else {
        setBotSpeechRendered(false);
        setRenderTypeWriter(false);
        await new Promise((resolve) => setTimeout(resolve, 100));
        setRenderTypeWriter(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        setBotSpeechRendered(true);

        await playWithInjection(audio);

        setTimeout(() => {
          setIsInterviewStarted(true);
          setTimer(0);
          startRec();
          videoSDKRecordingStartedRef.current = true;

          initializeBotAudioRecording().then(async () => {
            const started = await waitUntilRecordingStarted();
            if (started) {
              questionsStarted.current = true;
              setCountQuestion((prev) => prev + 1);
            }
          });
        }, (introAudioTime as number) * 1000);

        return () => {
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.src = "";
          }
        };
      }
    } catch (err) {
      console.error('Audio playback failed:', err);
      
      const isIOSDevice = isIOS();
      if (isIOSDevice) {
        setBotSpeechRendered(false);
        setRenderTypeWriter(false);
        await new Promise((resolve) => setTimeout(resolve, 50));
        setRenderTypeWriter(true);
        setBotSpeechRendered(true);
      } else {
        setBotSpeechRendered(false);
        setRenderTypeWriter(false);
        await new Promise((resolve) => setTimeout(resolve, 100));
        setRenderTypeWriter(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        setBotSpeechRendered(true);
      }
      
      setIsInterviewStarted(true);
      setTimer(0);
      startRec();
      videoSDKRecordingStartedRef.current = true;
      waitUntilRecordingStarted().then((started) => {
        if (started) {
          questionsStarted.current = true;
          setCountQuestion((prev) => prev + 1);
        }
      });
    }
  };

  const onIOSPlayClick: OnIOSPlayClickType = async (audio, event) => {
    try {
      await onUserGesture();
      setUserInteractionCaptured(true);
      setIsIosInterview(false);

      if (!recordingStartedRef.current) {
        await initializeBotAudioRecording();
      }

      if (audio) {
        try {
          await playWithInjection(audio);
        } catch (e) {
          console.error("[iOS] Intro audio play failed:", e);
          await audio.play().catch(() => {});
        }
      }

      await preloadFirstQuestionAudio();
      setIsInterviewStarted(true);
      setTimer(0);
      startRec();
      videoSDKRecordingStartedRef.current = true;

      const started = await waitUntilRecordingStarted(10000);
      
      if (started) {
        questionsStarted.current = true;
        await new Promise(resolve => setTimeout(resolve, 400));
        setCountQuestion(1);
      } else {
        questionsStarted.current = true;
        await new Promise(resolve => setTimeout(resolve, 500));
        setCountQuestion(1);
      }
    } catch (error) {
      setIsInterviewStarted(true);
      setTimer(0);
      startRec();
      videoSDKRecordingStartedRef.current = true;
      setIsIosInterview(false);
      questionsStarted.current = true;
      await new Promise(resolve => setTimeout(resolve, 500));
      setCountQuestion(1);
    }
  };

  const preloadFirstQuestionAudio = async (): Promise<void> => {
    if (!questions?.[0]?.qtn_audio_url || preloadedFirstQuestionAudio) {
      return;
    }

    const maxAttempts = MAX_AUDIO_PRELOAD_ATTEMPTS;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const audio = new Audio();
        audio.preload = "auto";
        audio.crossOrigin = "anonymous";
        audio.src = questions[0].qtn_audio_url;
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Preload timeout on attempt ${attempt}`));
          }, 5000);

          const onCanPlay = () => {
            clearTimeout(timeout);
            audio.removeEventListener("canplaythrough", onCanPlay);
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            resolve(audio);
          };

          const onError = (e: Event) => {
            clearTimeout(timeout);
            audio.removeEventListener("canplaythrough", onCanPlay);
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            reject(e);
          };

          audio.addEventListener("canplaythrough", onCanPlay);
          audio.addEventListener("canplay", onCanPlay);
          audio.addEventListener("error", onError);

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
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 300 * attempt));
          } else {
            throw playError;
          }
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          setAudioPreloadAttempts(attempt);
        }
      }
    }
  };

 const playAudioFromQuestions = async () => {
  await onUserGesture();
  setShowNextButtonOrNot(false);
  setTimer1(false);
  setRemainingTime(0);

  if (countdownRef.current) {
    clearInterval(countdownRef.current);
    countdownRef.current = null;
  }

  setIsPlayingQuestion(true);

  if (questionNo > 0 && interviewType !== "MCQ") {
    setIsInDelayPeriod(true);

    if (questionNo - 1 < questionsWithTimeStamps.length) {
      setQuestionEndTime(questionNo - 1);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsInDelayPeriod(false);
  }

  if (interviewType === "MCQ" && currentStage === "questions") {
    setTimer1(hasTimer(questionNo));
    
    const isIOSDevice = isIOS();
    
    if (isIOSDevice) {
      setBotSpeechRendered(false);
      setRenderTypeWriter(false);
      await new Promise((resolve) => setTimeout(resolve, 50));
      setRenderTypeWriter(true);
      setBotSpeechRendered(true);
    } else {
      setBotSpeechRendered(false);
      setRenderTypeWriter(false);
      await new Promise((resolve) => setTimeout(resolve, 100));
      setRenderTypeWriter(true);
      await new Promise((resolve) => setTimeout(resolve, 50));
      setBotSpeechRendered(true);
    }
    
    showNextButton();
    if (hasTimer(questionNo)) {
      startCountdown();
    }
    setIsPlayingQuestion(false);
    return;
  }

  const isIOSDevice = isIOS();
  const isSafariBrowser = isSafari();

  try {
    const botStartTimeStamp = dayjs().toISOString();
    setBotStartTime(botStartTimeStamp);

    if (isIOSDevice || isSafariBrowser) {
      let audio: HTMLAudioElement;
      let duration: number;

      if (questionNo === 0 && preloadedFirstQuestionAudio) {
        audio = preloadedFirstQuestionAudio;
        currentAudioRef.current = audio;
        audioDataRef.current = audio;
        audio.currentTime = 0;
        
        if (audio.duration && audio.duration > 0) {
          duration = audio.duration;
        } else {
          duration = await getDuration(questions[questionNo]?.qtn_audio_url) as number;
        }
      } else {
        audio = new Audio();
        audio.preload = "auto";
        audio.crossOrigin = "anonymous";
        currentAudioRef.current = audio;
        audioDataRef.current = audio;

        const audioSrc = questions[questionNo]?.audio || questions[questionNo]?.qtn_audio_url;

        if (audioSrc) {
          const blobUrl = typeof audioSrc === "string" ? audioSrc : URL.createObjectURL(audioSrc);
          audio.src = blobUrl;

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              resolve();
            }, 4000);

            const onCanPlay = () => {
              clearTimeout(timeout);
              audio.removeEventListener("canplaythrough", onCanPlay);
              audio.removeEventListener("canplay", onCanPlay);
              audio.removeEventListener("error", onError);
              resolve();
            };

            const onError = (e: Event) => {
              clearTimeout(timeout);
              audio.removeEventListener("canplaythrough", onCanPlay);
              audio.removeEventListener("canplay", onCanPlay);
              audio.removeEventListener("error", onError);
              resolve();
            };

            audio.addEventListener("canplaythrough", onCanPlay);
            audio.addEventListener("canplay", onCanPlay);
            audio.addEventListener("error", onError);

            if (isIOSDevice) {
              audio.load();
            }
          });
        }
        
        duration = audio.duration || await getDuration(questions[questionNo]?.qtn_audio_url) as number;
      }

      setBotSpeechDuration(duration);
      
      audio.onerror = (e) => {
        setBotSpeechRendered(false);
        setTimeout(() => {
          setRenderTypeWriter(true);
          setBotSpeechRendered(true);
          showNextButton();
        }, 100);
      };

      const audioStartedPlaying = new Promise<void>((resolve) => {
        let resolved = false;
        const onPlaying = () => {
          if (!resolved) {
            resolved = true;
            audio.removeEventListener('playing', onPlaying);
            audio.removeEventListener('play', onPlay);
            resolve();
          }
        };
        const onPlay = () => {
          if (!resolved) {
            resolved = true;
            audio.removeEventListener('playing', onPlaying);
            audio.removeEventListener('play', onPlay);
            resolve();
          }
        };
        
        audio.addEventListener('playing', onPlaying);
        audio.addEventListener('play', onPlay);
        
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            audio.removeEventListener('playing', onPlaying);
            audio.removeEventListener('play', onPlay);
            resolve();
          }
        }, 500);
      });

      const audioEnded = new Promise<void>((resolve) => {
        const onEnded = () => {
          audio.removeEventListener('ended', onEnded);
          resolve();
        };
        audio.addEventListener('ended', onEnded);
      });

      const playPromise = (async () => {
        try {
          if (sharedAudioContextRef.current && sharedAudioContextRef.current.state === 'suspended') {
            await sharedAudioContextRef.current.resume();
          }
          
          await playWithInjection(audio);
        } catch (e) {
          console.error(`[iOS] Play injection failed for question ${questionNo}:`, e);
          try {
            await audio.play();
          } catch (e2) {
            console.error(`[iOS] Direct play also failed for question ${questionNo}:`, e2);
            throw e2;
          }
        }
      })();

      await Promise.race([
        audioStartedPlaying,
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);

      await new Promise(resolve => setTimeout(resolve, 200));

      setBotSpeechRendered(false);
      setRenderTypeWriter(false);
      await new Promise((resolve) => setTimeout(resolve, 50));
      setRenderTypeWriter(true);
      setBotSpeechRendered(true);

      await audioEnded;

      await new Promise(resolve => setTimeout(resolve, 400));

      const questionStartTime = dayjs().toISOString();

      
      setQuestionsWithTimeStamps((prev) => {
        const newQuestion = {
          qtn: questions[questionNo]?.qtn,
          start_time: questionStartTime,
          bot_start_time: botStartTimeStamp,
          end_time: null,
          id: questions[questionNo]?.id,
          difficulty: questions[questionNo]?.difficulty,
        };
        return questionNo === 0 ? [newQuestion] : [...prev, newQuestion];
      });

      showNextButton();

      if (hasTimer(questionNo)) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setTimer1(true);
        startCountdown();
      }

    } 
    else {
      
      await getDurationByQuestionAudio();
      let duration: any = await getDuration(questions[questionNo]?.qtn_audio_url);


      setBotSpeechRendered(false);
      setRenderTypeWriter(false);
      await new Promise((resolve) => setTimeout(resolve, 100));
      setRenderTypeWriter(true);
      await new Promise((resolve) => setTimeout(resolve, 50));
      setBotSpeechRendered(true);

      const audio = new Audio();
      const srcCandidate = questions[questionNo]?.audio || questions[questionNo]?.qtn_audio_url || "";
      audio.src = typeof srcCandidate === "string" ? srcCandidate : URL.createObjectURL(srcCandidate as Blob);

      
      await playWithInjection(audio).catch(err => {
        console.error(`[Non-iOS] Audio playback failed for question ${questionNo}:`, err);
      });


      const questionStartTime = dayjs().toISOString();

      if (questionNo !== questions.length) {
        showNextButton();

        if (interviewType !== "MCQ" && hasTimer(questionNo)) {
          setTimer1(true);
          startCountdown();
        }
      }

      if (questionNo === 0) {
        setQuestionsWithTimeStamps([
          {
            qtn: questions[0]?.qtn,
            start_time: questionStartTime,
            bot_start_time: botStartTimeStamp,
            end_time: null,
            id: questions[0]?.id,
            difficulty: questions[0]?.difficulty,
          },
        ]);
      } else {
        setQuestionsWithTimeStamps(prev => [
          ...prev,
          {
            qtn: questions[questionNo]?.qtn,
            start_time: questionStartTime,
            bot_start_time: botStartTimeStamp,
            end_time: null,
            id: questions[questionNo]?.id,
            difficulty: questions[questionNo]?.difficulty,
          }
        ]);
      }
    }
  } catch (err) {
    console.error(`[PlayAudio] Audio playback failed for question ${questionNo}:`, err);
    
    const isIOSDevice = isIOS();
    if (isIOSDevice) {
      setBotSpeechRendered(false);
      setRenderTypeWriter(false);
      await new Promise((resolve) => setTimeout(resolve, 50));
      setRenderTypeWriter(true);
      setBotSpeechRendered(true);
    } else {
      setBotSpeechRendered(false);
      setRenderTypeWriter(false);
      await new Promise(resolve => setTimeout(resolve, 100));
      setRenderTypeWriter(true);
      await new Promise(resolve => setTimeout(resolve, 50));
      setBotSpeechRendered(true);
    }
    showNextButton();
  } finally {
    setIsPlayingQuestion(false);
  }
};

  const startCountdown = () => {
    if (!hasTimer(questionNo)) {
      return;
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    const currentTime = randomTimes[questionNo];

    if (!currentTime || currentTime <= 0) {
      return;
    }

    setRemainingTime(currentTime);

    countdownRef.current = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime === 1) {
          if (countdownRef.current !== null) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }

          setQuestionEndTime(questionNo);

          const isIOSDevice = isIOS();
          if (isIOSDevice) {
            setIsTimerCompleted(true);
            showNextButton();
            return 0;
          }
          if (interviewType === "MCQ") {
            if (questionNo === questions.length - 1) {
              countdownActionRef.current = "submit";
            } else {
              countdownActionRef.current = "next";
            }
          } else {
            countdownActionRef.current = "next";
          }
          setCountdownEnded(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!countdownEnded) return;
    if (!hasTimer(questionNo)) {
      setCountdownEnded(false);
      countdownActionRef.current = null;
      return;
    }
    try {
      if (interviewType === "MCQ") {
        if (countdownActionRef.current === "submit") {
          if (!isSubmittingRef.current && !interviewCompleted && !submittingInterview) {
            submitInterviewForTesting();
          }
        } else {
          startNextQuestionWithDelay(false);
        }
      } else {
        startNextQuestionWithDelay(true);
      }
    } finally {
      countdownActionRef.current = null;
      setCountdownEnded(false);
    }
  }, [countdownEnded]);

  const handleManualNextQuestion = async () => {
    await onUserGesture();
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setTimer1(false);
    setRemainingTime(0);

    setQuestionEndTime(questionNo);

    setIsTimerCompleted(false);
    countdownActionRef.current = null;
    
    if (interviewType === "MCQ") {
      startNextQuestionWithDelay(false);
    } else {
      startNextQuestionWithDelay(true);
    }
  };

  const startNextQuestionWithDelay = (useDelay: boolean = true) => {
    if (typeof window !== 'undefined' && (window as any).questionProgressionInProgress) {
      return;
    }
    
    if (typeof window !== 'undefined') {
      (window as any).questionProgressionInProgress = true;
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          (window as any).questionProgressionInProgress = false;
        }
      }, 1000);
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setTimer1(false);
    setRemainingTime(0);

    if (questionNo < questions.length) {
      setQuestionEndTime(questionNo);
    }

    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    } catch { }
    
    setBotSpeechRendered(false);
    setRenderTypeWriter(false);

    if (useDelay) {
      setIsInDelayPeriod(true);
      setTimeout(() => {
        setIsInDelayPeriod(false);
        startTheNextQuestion();
      }, 500);
    } else {
      startTheNextQuestion();
    }
  };

  useEffect(() => {
    const isIOSDevice = isIOS();
    const isSafariBrowser = isSafari();

    if (isIOSDevice || isSafariBrowser) {
      const timer = setTimeout(() => {
        const shouldPlayQuestion = 
          isInterviewStarted && 
          questionsStarted.current && 
          questions && 
          questions.length > 0 && 
          questionNo < questions.length &&
          !questionPlayedRef.current.has(questionNo) &&
          !isPlayingQuestion;
        
        if (shouldPlayQuestion) {
          questionPlayedRef.current.add(questionNo);
          playAudioFromQuestions();
        }
      }, questionNo === 0 ? 250 : 150);
      
      return () => clearTimeout(timer);
    } else {
      if (
        countQuestion > 0 &&
        !questionPlayedRef.current.has(questionNo) &&
        questions &&
        questions.length > 0 &&
        questionNo < questions.length
      ) {
        questionPlayedRef.current.add(questionNo);
        
        setBotSpeechRendered(false);
        setRenderTypeWriter(false);
        
        setTimeout(() => {
          playAudioFromQuestions();
        }, 50);
      }
    }
  }, [countQuestion, questionNo, isInterviewStarted, isPlayingQuestion]);

  useEffect(() => {
    if (!isRecording || !isInterviewStarted) return;
    if (!questions || questions.length === 0) return;
    if (questionNo >= questions.length) return;

    const isSafariBrowser = isSafari();
    const isIOSDevice = isIOS();
    
    if ((isSafariBrowser || isIOSDevice) && !questionPlayedRef.current.has(questionNo)) {
      if (questionNo === 0 && questionsStarted.current) {
        setTimeout(() => {
          if (!questionPlayedRef.current.has(0)) {
            setCountQuestion(1);
          }
        }, 350);
      } else if (questionNo > 0) {
        setTimeout(() => {
          if (!questionPlayedRef.current.has(questionNo)) {
            setCountQuestion((prev) => prev + 1);
          }
        }, 150);
      }
    } else if (!questionPlayedRef.current.has(questionNo)) {
      setTimeout(() => {
        setCountQuestion((prev) => prev + 1);
      }, 0);
    }
  }, [questionNo, isInterviewStarted, isRecording, questions.length, questionsStarted.current]);

  const captureImage = (): Promise<{ fileName: string; base64: string } | null> => {
    return new Promise((resolve) => {
      const videoStreamEntry = localParticipant?.streams
        ? Array.from(localParticipant.streams.values()).find((stream: any) => stream.kind === "video")
        : undefined;
      const videoStream = videoStreamEntry?.track ? new MediaStream([videoStreamEntry.track]) : undefined;

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
        video.play().catch(() => { });

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
              const base64 = canvas.toDataURL("image/jpeg", 0.8);
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
      }, 3000);
    });
  };

  const uploadImageData = async (imageData: { fileName: string; base64: string }, captureType: string) => {
    try {
      const response = await interviewUserImagesAPI({
        payload: {
          file_name: imageData.fileName,
          base64: imageData.base64,
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
              if (result) {
                return result;
              }
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
            if (retryResult) {
              return retryResult;
            }
          }
        }
      }
      
      return result;
    } catch (error) {
      const isAbsenceCapture = captureType.includes("absence");
      if (isAbsenceCapture) {
        try {
          for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const imageData = await captureImage();
            if (imageData) {
              const result = await uploadImageData(imageData, captureType);
              if (result) {
                return result;
              }
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
    
    if (totalQuestions > 0) {
      const midPoint = Math.floor(totalQuestions / 2);
      
      if (questionNo === 0 && !fixedScreenshotFlags.current.start) {
        fixedScreenshotFlags.current.start = true;
        captureAndUpload("fixedstart");
      }
      
      if (questionNo === midPoint && !fixedScreenshotFlags.current.mid && totalQuestions > 1) {
        fixedScreenshotFlags.current.mid = true;
        captureAndUpload("fixedmid");
      }
      
      if (questionNo === totalQuestions - 1 && !fixedScreenshotFlags.current.end) {
        fixedScreenshotFlags.current.end = true;
        captureAndUpload("fixedend");
      }
    }
    
    if (questionNo === 0) {
      eyeTransitionCaptureCount.current = 0;
      eyeTransitionDetectionCount.current = 0;
      multiFaceCaptureCount.current = 0;
      multiFaceDetectionCount.current = 0;
      userAbsenceCaptureCount.current = 0;
      userAbsenceDetectionCount.current = 0;
      prevEyeLeftCount.current = 0;
      prevEyeRightCount.current = 0;
      currentMultiFaceState.current = false;
      currentUserAbsenceState.current = false;
      noFaceDetectedStartTime.current = null;
      hasPreCaptured.current = false;
      lastEyeCaptureTime.current = 0;
      lastMultiFaceCaptureTime.current = 0;
      lastAbsenceCaptureTime.current = 0;
      fileKeysRef.current = [];
      multiFaceIntervalRef.current = [];
      userAbsenceIntervalRef.current = [];
    }
  }, [questionNo, isInterviewStarted, isRecording, interviewCompleted, questions.length]);

  useEffect(() => {
    if (!isInterviewStarted || !isRecording || interviewCompleted) return;

    const checkInterval = setInterval(() => {
      const currentLeftCount = 
        detectionCounts.current.eye_left_count || 
        detectionCounts.current.eyeLeftCount || 
        detectionCounts.current.eyeleftcount || 
        0;
        
      const currentRightCount = 
        detectionCounts.current.eye_right_count || 
        detectionCounts.current.eyeRightCount || 
        detectionCounts.current.eyerightcount || 
        0;

      const leftIncreased = currentLeftCount > prevEyeLeftCount.current;
      const rightIncreased = currentRightCount > prevEyeRightCount.current;

      if (leftIncreased) {
        const delta = currentLeftCount - prevEyeLeftCount.current;
        eyeTransitionDetectionCount.current += delta;
      }
      
      if (rightIncreased) {
        const delta = currentRightCount - prevEyeRightCount.current;
        eyeTransitionDetectionCount.current += delta;
      }

      if (questionsStarted.current && (leftIncreased || rightIncreased) && eyeTransitionCaptureCount.current < MAX_CAPTURES) {
        const now = Date.now();
        const timeSinceLastCapture = now - lastEyeCaptureTime.current;

        if (timeSinceLastCapture >= MIN_CAPTURE_INTERVAL || lastEyeCaptureTime.current === 0) {
          eyeTransitionCaptureCount.current++;
          lastEyeCaptureTime.current = now;
          captureAndUpload('eyetransition');
        }
      }

      prevEyeLeftCount.current = currentLeftCount;
      prevEyeRightCount.current = currentRightCount;
    }, 300);

    return () => clearInterval(checkInterval);
  }, [isInterviewStarted, isRecording, interviewCompleted, questionsStarted.current]);

  useEffect(() => {
    if (!questionsStarted.current || !isInterviewStarted || interviewCompleted) {
      return;
    }

    const interval = setInterval(() => {
      const detectionState = detectionCounts.current;
      const now = Date.now();
      
      const isMultiFaceDetected = 
        (detectionState.multiple_face_detected_count && detectionState.multiple_face_detected_count > 0) ||
        detectionState.multiple_face_detected === true ||
        (detectionState.face_count && detectionState.face_count > 1) ||
        (detectionState.faceCount && detectionState.faceCount > 1) ||
        (detectionState.lastFaceCount && detectionState.lastFaceCount > 1);

      
      if (isMultiFaceDetected) {
        if (!currentMultiFaceState.current) {
          currentMultiFaceState.current = true;
          
          if (multiFaceCaptureCount.current < MAX_CAPTURES) {
            multiFaceCaptureCount.current++;
            lastMultiFaceCaptureTime.current = now;
            captureAndUpload('multifacedetection');
          }
        } 
        else if (multiFaceCaptureCount.current < MAX_CAPTURES) {
          const timeSinceLastCapture = now - lastMultiFaceCaptureTime.current;
          if (timeSinceLastCapture >= MIN_CAPTURE_INTERVAL) {
            multiFaceCaptureCount.current++;
            lastMultiFaceCaptureTime.current = now;
            captureAndUpload('multifacedetection');
          }
        }
      } 
      else if (currentMultiFaceState.current) {
        currentMultiFaceState.current = false;
      }

      const intervals = multiFaceIntervalRef.current;
      
      if (isMultiFaceDetected) {
        const lastInterval = intervals[intervals.length - 1];
        if (!lastInterval || lastInterval.endTime !== null) {
          multiFaceIntervalRef.current.push({
            startTime: now,
            endTime: null
          });
        }
      } else {
        const lastInterval = intervals[intervals.length - 1];
        if (lastInterval && lastInterval.endTime === null) {
          lastInterval.endTime = now;
        }
      }
    }, 300);

    return () => {
      clearInterval(interval);
      const lastInterval = multiFaceIntervalRef.current[multiFaceIntervalRef.current.length - 1];
      if (lastInterval && lastInterval.endTime === null) {
        lastInterval.endTime = Date.now();
      }
    };
  }, [isInterviewStarted, isRecording, interviewCompleted, questionsStarted.current]);

  useEffect(() => {
    if (!isInterviewStarted || !isRecording || interviewCompleted) return;

    const interval = setInterval(() => {
      const detectionState = detectionCounts.current;
      const now = Date.now();
      const isUserAbsent = 
        detectionState.no_face_detected === true ||
        detectionState.noFaceDetected === true ||
        detectionState.nofacedetected === true ||
        detectionState.face_detected === false ||
        detectionState.faceDetected === false ||
        (detectionState.face_count !== undefined && detectionState.face_count === 0) ||
        (detectionState.faceCount !== undefined && detectionState.faceCount === 0);


      if (isUserAbsent && !currentUserAbsenceState.current) {
        userAbsenceDetectionCount.current++;
        currentUserAbsenceState.current = true;
        
        if (userAbsenceCaptureCount.current < MAX_CAPTURES) {
          userAbsenceCaptureCount.current++;
          lastAbsenceCaptureTime.current = now;
          captureAndUpload('userabsenceFromCamera');
        }
        
        const intervals = userAbsenceIntervalRef.current;
        const lastInterval = intervals[intervals.length - 1];
        if (!lastInterval || lastInterval.endTime !== null) {
          userAbsenceIntervalRef.current.push({
            startTime: now,
            endTime: null
          });
        }
      } 
      else if (!isUserAbsent && currentUserAbsenceState.current) {
        currentUserAbsenceState.current = false;        
        const intervals = userAbsenceIntervalRef.current;
        const lastInterval = intervals[intervals.length - 1];
        if (lastInterval && lastInterval.endTime === null) {
          lastInterval.endTime = now;
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isInterviewStarted, isRecording, interviewCompleted, questionsStarted.current]);

  const calculateMultiFaceTime = (): number => {
    const intervals = multiFaceIntervalRef.current;
    const now = Date.now();
    const totalTimeMs = intervals.reduce((total: number, interval: { endTime: number | null; startTime: number }) => {
      const endTime = interval.endTime !== null ? interval.endTime : now;
      const duration = endTime - interval.startTime;
      return total + duration;
    }, 0);

    return Math.round((totalTimeMs / 1000) * 100) / 100;
  };

  const calculateUserAbsenceTime = (): number => {
    const intervals = userAbsenceIntervalRef.current;
    const now = Date.now();
    const totalTimeMs = intervals.reduce((total: number, interval: { endTime: number | null; startTime: number }) => {
      const endTime = interval.endTime !== null ? interval.endTime : now;
      const duration = endTime - interval.startTime;
      return total + duration;
    }, 0);

    return Math.round((totalTimeMs / 1000) * 100) / 100;
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

  const startSubmittingInterview = async () => {
    try {
      isSubmittingRef.current = true;
      setSubmittingInterview(true);
      if (interviewCompleted) return;

      stopBotAudioRecording();

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

      const firstQuesStartTime =
        interviewType === "MCQ"
          ? (interviewTimes?.firstQuestionTime?.toISOString() ?? dayjs().toISOString())
          : (questionsWithTimeStamps[0]?.start_time ?? dayjs().toISOString());

      const lastQuesEndTime =
        interviewType === "MCQ"
          ? (interviewTimes?.lastQuestionTime?.toISOString() ?? dayjs().toISOString())
          : (questionsWithTimeStamps[questionsWithTimeStamps.length - 1]?.end_time ?? dayjs().toISOString());

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
              bot_start_time: qtn.bot_start_time,
              end_time: qtn.end_time,
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

      let lastFileKey = null;
      if (fileKeysRef.current.length > 0) {
        lastFileKey = fileKeysRef.current[fileKeysRef.current.length - 1];
      }
      
      const screenshotPayload = lastFileKey ? { candidate_screenshots_path: lastFileKey } : {}; 

      const payload = {
        duration: Math.abs(Math.ceil(totalDurationInMins)),
        interview_date: lastQuestionTime,
        auth_token: videoSDKToken,
        room_id: meetingId,
        qtn_ans: questionResponses,
        total_qtns:
          interviewType === "MCQ"
            ? questionAnswers?.length || 0
            : questionAns.filter((qtn) => qtn.qtn && qtn.id).length,
        proctoring_activity_count: {
          tab_switching_count: counts.leaveCount,
          user_absence_count: userAbsenceDetectionCount.current,
          disable_cam_count: counts.video,
          disable_mic_count: counts.audio,
          total_tab_switching_time: totalTabSwitchingTime,
          total_camera_disabling_time: totalCameraDisablingTime,
          total_mic_muting_time: totalMicMutingTime,
          eye_right_count: detectionCounts.current.eye_right_count || detectionCounts.current.eyerightcount || 0,
          eye_left_count: detectionCounts.current.eye_left_count || detectionCounts.current.eyeleftcount || 0,
          eye_up_count: detectionCounts.current.eye_up_count || detectionCounts.current.eyeupcount || 0,
          eye_down_count: detectionCounts.current.eye_down_count || detectionCounts.current.eyedowncount || 0,
          total_eye_right_time: calculateTotalEyeTime(eyeTimeIntervals?.right || []),
          total_eye_left_time: calculateTotalEyeTime(eyeTimeIntervals?.left || []),
          total_eye_up_time: calculateTotalEyeTime(eyeTimeIntervals?.up || []),
          total_eye_down_time: calculateTotalEyeTime(eyeTimeIntervals?.down || []),
          multiple_face_detected: detectionCounts.current.multiple_face_detected_count >= 1,
          multiple_face_detected_count: detectionCounts.current.multiple_face_detected_count,
          multiple_face_detected_time: calculateMultiFaceTime(),
          user_absence_time: calculateUserAbsenceTime(),
          eye_transition_count: eyeTransitionDetectionCount.current,
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

  const playConclude = async (): Promise<void> => {
    if (concludeStartedRef.current) {
      return;
    }
    concludeStartedRef.current = true;

    setIsInterviewCompleted(true);

    if (
      questionsWithTimeStamps.length > 0 &&
      !questionsWithTimeStamps[questionsWithTimeStamps.length - 1].end_time
    ) {
      setQuestionEndTime(questionsWithTimeStamps.length - 1);
    }

    setShowNextButtonOrNot(false);

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const audio = new Audio();
      const introData: any = await getItemByIdIntroConclude(1, "intro_conclude");

      if (!introData?.data?.conclude_blob) {
        throw new Error("Conclude audio blob not found");
      }

      audio.src = URL.createObjectURL(introData.data.conclude_blob as Blob);

      let concludeAudioTime = await getDuration(interviewData?.conclude_dailog_audio_url);
      setBotSpeechDuration(concludeAudioTime as number);

      const isIOSDevice = isIOS();
      
      if (isIOSDevice) {
        setBotSpeechRendered(false);
        setRenderTypeWriter(false);
        await new Promise((resolve) => setTimeout(resolve, 50));
        setRenderTypeWriter(true);
        setBotSpeechRendered(true);
      } else {
        setBotSpeechRendered(false);
        setRenderTypeWriter(false);
        await new Promise((resolve) => setTimeout(resolve, 100));
        setRenderTypeWriter(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        setBotSpeechRendered(true);
      }

      await playWithInjection(audio);

      setTimeout(() => {
        if (!isSubmittingRef.current && !interviewCompleted && !submittingInterview) {
          startSubmittingInterview();
        }
      }, (concludeAudioTime as number) * 1000);
    } catch (error) {
      if (!isSubmittingRef.current && !interviewCompleted && !submittingInterview) {
        startSubmittingInterview();
      }
    }
  };

  const submitInterviewForTesting = () => {
    if (!isSubmittingRef.current && !interviewCompleted && !submittingInterview) {
      startSubmittingInterview();
    }
  };

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
      for (let i = 0; i < interviewQuestions.length - 1; i++) {
        if (interviewQuestions[i].end_time === null) {
          interviewQuestions[i].end_time = parsedData.timestamp123;
        }
      }

      const remainingQuestions = questions
        .slice(interviewQuestions.length)
        .map((qtn) => {
          return {
            qtn: qtn.qtn,
            id: qtn.id,
            start_time: parsedData.timestamp123,
            bot_start_time: parsedData.timestamp123,
            end_time: parsedData.timestamp123,
            difficulty: qtn.difficulty,
          };
        });

      const allQuestions = [...interviewQuestions, ...remainingQuestions];

      const startSubmittingInterview2 = async () => {
        try {
          isSubmittingRef.current = true;
          setSubmittingInterview(true);
          if (interviewCompleted) return;
          stopBotAudioRecording();
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
            qtn_ans: allQuestions
              .filter((qtn) => qtn.qtn && qtn.id)
              .map((qtn) => ({
                qtn: qtn.qtn,
                id: qtn.id,
                start_time: qtn.start_time,
                bot_start_time: qtn.bot_start_time,
                end_time: qtn.end_time,
                difficulty: qtn.difficulty,
              })),
            total_qtns: allQuestions.filter((qtn) => qtn.qtn && qtn.id).length,
            proctoring_activity_count: {
              tab_switching_count: counts.leaveCount,
              user_absence_count: userAbsenceDetectionCount.current,
              disable_cam_count: counts.video,
              disable_mic_count: counts.audio,
              total_tab_switching_time: totalTabSwitchingTime,
              total_camera_disabling_time: totalCameraDisablingTime,
              total_mic_muting_time: totalMicMutingTime,
              eye_right_count: detectionCounts.current.eye_right_count,
              eye_left_count: detectionCounts.current.eye_left_count,
              eye_up_count: detectionCounts.current.eye_up_count,
              eye_down_count: detectionCounts.current.eye_down_count,
              total_eye_right_time: calculateTotalEyeTime(eyeTimeIntervals?.right || []),
              total_eye_left_time: calculateTotalEyeTime(eyeTimeIntervals?.left || []),
              total_eye_up_time: calculateTotalEyeTime(eyeTimeIntervals?.up || []),
              total_eye_down_time: calculateTotalEyeTime(eyeTimeIntervals?.down || []),
              multiple_face_detected: detectionCounts.current.multiple_face_detected_count >= 1,
              multiple_face_detected_count: detectionCounts.current.multiple_face_detected_count,
              multiple_face_detected_time: calculateTotalEyeTime(eyeTimeIntervals?.multiFaces || []),
              user_absence_time: calculateUserAbsenceTime(),
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
            fileKeysRef.current = [];

            if (isRecording) {
              stopRecording();
            }
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

      if (!isSubmittingRef.current && !interviewCompleted && !submittingInterview) {
        startSubmittingInterview2();
      }
    }
  };

  useEffect(() => {
    const initRecording = async () => {
      if (!recordingStartedRef.current) {
        await initializeBotAudioRecording();
      }
    };
    initRecording();
    return () => {
      stopBotAudioRecording();
    };
  }, []);

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
      stopBotAudioRecording();

      const lastInterval = multiFaceIntervalRef.current[multiFaceIntervalRef.current.length - 1];
      if (lastInterval && lastInterval.endTime === null) {
        lastInterval.endTime = Date.now();
      }
    };
  }, []);

  useEffect(() => {
    if (
      isInterviewStarted &&
      questions.length > 0 &&
      questionNo >= questions.length &&
      !concludeStartedRef.current &&
      questionsWithTimeStamps.length === questions.length
    ) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setTimer1(false);
      setRemainingTime(0);
      
      setCurrentStage && setCurrentStage("conclusion");
      setTimeout(() => {
        playConclude();
      }, 0);
    }
  }, [questionNo, isInterviewStarted, questions.length, questionsWithTimeStamps.length]);

  useEffect(() => {
    if (counts.video >= 3 || videoStreamOff) {
      setEndCall && setEndCall(true);
    }
  }, [counts.video, videoStreamOff, setEndCall]);

  useEffect(() => {
    const isValidDuration = interviewData?.duration && interviewData.duration > 0;
    if (!isValidDuration) return;

    const timeoutId = setTimeout(() => {
      setIsDurationCompleted(true);
    }, interviewData.duration * 60 * 1000);

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
    botMediaRecorder,
    botAudioChunks,
    isInDelayPeriod,
  };
};

export default useQuestionsHook;