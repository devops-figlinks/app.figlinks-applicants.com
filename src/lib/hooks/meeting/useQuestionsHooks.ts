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
  const multiFaceDetectionCount = useRef(0);
  const lastMultiFaceValue = useRef(0);
  const fileKeysRef = useRef<string[]>([]);
  const lastCaptureTime = useRef<number>(0);
  const multiFaceIntervalRef = useRef<{ startTime: number; endTime: number | null }[]>([]);

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
    setTimer1(false);
    setRemainingTime(0);
    countdownActionRef.current = null;
    setCountdownEnded(false);
  }, [questionNo]);

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
          await audio.play().catch(() => { });
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
        setQuestionsWithTimeStamps((prev) => {
          const updated = [...prev];
          if (updated[questionNo - 1] && !updated[questionNo - 1].end_time) {
            const endTime = dayjs().toISOString();
            updated[questionNo - 1].end_time = endTime;
            const duration = ((new Date(endTime).getTime() - new Date(updated[questionNo - 1].start_time).getTime()) / 1000).toFixed(2);
          }
          return updated;
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsInDelayPeriod(false);
    }

    if (interviewType === "MCQ" && currentStage === "questions") {
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
        setTimer1(true);
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
        console.log(`[iOS] Processing question ${questionNo}`);
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

        console.log(`[iOS] Waiting for audio to end for question ${questionNo}...`);
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

        if (interviewType !== "MCQ" && hasTimer(questionNo)) {
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

          setQuestionsWithTimeStamps((prev) => {
            const updated = [...prev];
            if (updated[questionNo] && !updated[questionNo].end_time) {
              const endTime = dayjs().toISOString();
              updated[questionNo].end_time = endTime;
              const duration = ((new Date(endTime).getTime() - new Date(updated[questionNo].start_time).getTime()) / 1000).toFixed(2);
            }
            return updated;
          });

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
          submitInterviewForTesting();
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

    setQuestionsWithTimeStamps((prev) => {
      const updated = [...prev];
      if (updated[questionNo] && !updated[questionNo].end_time) {
        const endTime = dayjs().toISOString();
        updated[questionNo].end_time = endTime;
        const duration = ((new Date(endTime).getTime() - new Date(updated[questionNo].start_time).getTime()) / 1000).toFixed(2);
      }
      return updated;
    });

    setIsTimerCompleted(false);
    countdownActionRef.current = null;

    if (interviewType === "MCQ") {
      startNextQuestionWithDelay(false);
    } else {
      startNextQuestionWithDelay(true);
    }
  };

  const startNextQuestionWithDelay = (useDelay: boolean = true) => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setTimer1(false);
    setRemainingTime(0);

    if (questionNo < questions.length) {
      setQuestionsWithTimeStamps((prev) => {
        const updated = [...prev];
        if (updated[questionNo] && !updated[questionNo].end_time) {
          const endTime = dayjs().toISOString();
          updated[questionNo].end_time = endTime;
          const duration = ((new Date(endTime).getTime() - new Date(updated[questionNo].start_time).getTime()) / 1000).toFixed(2);
        }
        return updated;
      });
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
      const updated = [...questionsWithTimeStamps];
      const endTime = dayjs().toISOString();
      updated[updated.length - 1].end_time = endTime;
      const duration = ((new Date(endTime).getTime() - new Date(updated[updated.length - 1].start_time).getTime()) / 1000).toFixed(2);
      setQuestionsWithTimeStamps(updated);
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
        startSubmittingInterview();
      }, (concludeAudioTime as number) * 1000);
    } catch (error) {
      startSubmittingInterview();
    }
  };

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

        const drawFrame = () => {
          if (video.readyState >= 2) {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext("2d");
            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64 = canvas.toDataURL("image/jpeg", 0.8);
              const fileName = `multiface_capture_${Date.now()}_${multiFaceCaptureCount.current}.jpg`;
              video.pause();
              video.srcObject = null;
              video.removeEventListener("error", onError);
              resolve({ fileName, base64 });
              return;
            }
          }
          requestAnimationFrame(drawFrame);
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

  const captureAndUpload = async () => {
    try {
      const imageData = await captureImage();
      if (!imageData) {
        return;
      }

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
      } else {
        console.error("Image upload failed:", response);
      }
    } catch (error) {
      console.error("Error in captureAndUpload:", error);
    }
  };

  useEffect(() => {
    const COOLDOWN_MS = 2000;
    const MAX_CAPTURES = 3;

    const interval = setInterval(() => {
      if (!questionsStarted.current || !isInterviewStarted || interviewCompleted) {
        return;
      }

      const currentCount = detectionCounts.current.multiple_face_detected_count;
      if (currentCount > lastMultiFaceValue.current) {
        const delta = currentCount - lastMultiFaceValue.current;
        multiFaceDetectionCount.current += delta;
        lastMultiFaceValue.current = currentCount;
        const now = Date.now();
        const canCapture = (now - lastCaptureTime.current) >= COOLDOWN_MS && multiFaceCaptureCount.current < MAX_CAPTURES;

        if (canCapture) {
          multiFaceCaptureCount.current++;
          lastCaptureTime.current = now;
          captureAndUpload();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isInterviewStarted, interviewCompleted]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const trackMultiFaceTime = () => {
      if (!questionsStarted.current) {
        return;
      }

      const currentCount = detectionCounts.current.multiple_face_detected_count;
      const intervals = multiFaceIntervalRef.current;

      if (currentCount > 0) {
        const lastInterval = intervals[intervals.length - 1];
        if (!lastInterval || lastInterval.endTime !== null) {
          multiFaceIntervalRef.current.push({
            startTime: Date.now(),
            endTime: null
          });
        }
      } else {
        const lastInterval = intervals[intervals.length - 1];
        if (lastInterval && lastInterval.endTime === null) {
          lastInterval.endTime = Date.now();
        }
      }
    };

    if (isInterviewStarted && !interviewCompleted) {
      intervalId = setInterval(trackMultiFaceTime, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      const lastInterval = multiFaceIntervalRef.current[multiFaceIntervalRef.current.length - 1];
      if (lastInterval && lastInterval.endTime === null) {
        lastInterval.endTime = Date.now();
      }
    };
  }, [isInterviewStarted, interviewCompleted]);

  const calculateMultiFaceTime = (): number => {
    const intervals = multiFaceIntervalRef.current;
    const now = Date.now();

    const totalTimeMs = intervals.reduce((total, interval) => {
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

      setSubmittingInterview(true);
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

      let imageFileKey = fileKeysRef.current.length > 0 ? fileKeysRef.current[fileKeysRef.current.length - 1] : null;

      const { eyeTimeIntervals } = detectionCounts.current;

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
          multiple_face_detected: multiFaceDetectionCount.current >= 1,
          multiple_face_detected_count: multiFaceDetectionCount.current,
          multiple_face_detected_time: calculateMultiFaceTime(),
        },
        meeting_room_id: meetingId,
        ...(imageFileKey !== null && {
          candidate_screenshots_path: imageFileKey,
        }),
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
      setSubmittingInterview(false);
    }
  };

  const submitInterviewForTesting = () => {
    startSubmittingInterview();
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

          setSubmittingInterview(true);
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
          let imageFileKey = fileKeysRef.current.length > 0 ? fileKeysRef.current[fileKeysRef.current.length - 1] : null;

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
              multiple_face_detected: multiFaceDetectionCount.current >= 1,
              multiple_face_detected_count: multiFaceDetectionCount.current,
              multiple_face_detected_time: calculateMultiFaceTime(),
            },
            meeting_room_id: meetingId,
            ...(imageFileKey !== null && {
              candidate_screenshots_path: imageFileKey,
            }),
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
          setSubmittingInterview(false);
        }
      };

      startSubmittingInterview2();
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
      if (interviewType === "MCQ") {
        submitInterviewForTesting();
      } else {
        submitStoredInterview();
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