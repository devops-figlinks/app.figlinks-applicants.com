import {
  deleteItemByIdIntroConclude,
  getItemByIdIntroConclude,
} from "@/helpers/indexedDBIntroConclude";
import { deleteObject, getAllItems } from "@/helpers/indexedDBQuestions";
import { errPopper } from "@/helpers/popper/errPopper";
import { successPopper } from "@/helpers/popper/successPopper";
import {
  interviewUserImagesAPI,
  saveInterviewAPI,
} from "@/https/services/interviews";
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
  const [questionsWithTimeStamps, setQuestionsWithTimeStamps] = useState<
    IQuesTime[]
  >([]);
  const [showNextButtonOrNot, setShowNextButtonOrNot] = useState(false);
  const [submittingInterview, setSubmittingInterview] = useState(false);
  const [isDurationCompleted, setIsDurationCompleted] = useState(false);
  const { stopRecording, changeMic } = useMeeting();
  const [timer1, setTimer1] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const randomTimes = useMemo(
    () => questions.map((q) => q.time_limit),
    [questions]
  );
  const [isIosInterview, setIsIosInterview] = useState(false);
  const [imageCaputureApiCall, setImageCaputureApiCall] = useState(false);
  const imageCaputureApiCallRef = useRef(false);
  const [userInteractionCaptured, setUserInteractionCaptured] = useState(false);
  const [preloadedFirstQuestionAudio, setPreloadedFirstQuestionAudio] =
    useState<HTMLAudioElement | null>(null);
  const [audioPreloadAttempts, setAudioPreloadAttempts] = useState(0);
  const MAX_AUDIO_PRELOAD_ATTEMPTS = 3;

  const [botMediaRecorder, setBotMediaRecorder] =
    useState<MediaRecorder | null>(null);
  const [botAudioChunks, setBotAudioChunks] = useState<Blob[]>([]);
  const botAudioStreamRef = useRef<MediaStream | null>(null);
  const recordingStartedRef = useRef(false);
  const isInitializingRecorderRef = useRef(false);
  const userMicStreamRef = useRef<MediaStream | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sharedAudioContextRef = useRef<AudioContext | null>(null);
  const sharedDestinationNodeRef =
    useRef<MediaStreamAudioDestinationNode | null>(null);

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

  const initializeBotAudioRecording = async () => {
    try {
      if (botMediaRecorder) {
        try {
          botMediaRecorder.stop();
        } catch {}
        setBotMediaRecorder(null);
      }

      if (sharedAudioContextRef.current) {
        try {
          sharedAudioContextRef.current.close();
        } catch {}
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
        console.error(
          "[AudioInit] Failed to capture participant mic for recording:",
          micErr
        );
      }

      setBotAudioChunks([]);

      try {
        (window as any).__injectedMixedMicActive = true;
        (window as any).__injectedMixedMicStreamId = (
          destination.stream as any
        )?.id;
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

      recorder.onerror = (error) => {
        console.error("[Recorder] Bot audio recording error:", error);
      };

      recorder.onstop = () => {
        console.log("[Recorder] Recording stopped");
      };

      recorder.onstart = () => {
        console.log("[Recorder] Recording started successfully");
      };

      setBotMediaRecorder(recorder);
      recordingStartedRef.current = true;

      try {
        recorder.start(1000);
        console.log("[Recorder] SINGLE bot audio recording started");
      } catch (startError) {
        console.error("[Recorder] Failed to start recording:", startError);
        recordingStartedRef.current = false;
        setBotMediaRecorder(null);
        throw startError;
      }
    } catch (error) {
      console.error(
        "[AudioInit] Failed to initialize bot audio recording:",
        error
      );
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
        } catch {}
        micSourceNodeRef.current = null;
      }
      if (userMicStreamRef.current) {
        userMicStreamRef.current.getTracks().forEach((track) => track.stop());
        userMicStreamRef.current = null;
      }
    } catch (e) {
      console.error(
        "[AudioStop] Error cleaning up mic stream after recording stop:",
        e
      );
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
      const duration = await getMediaDuration(
        questions[questionNo]?.qtn_audio_url
      );
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
      await audio.play();
    } finally {
      await cleanup();
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

  const playIntro = async () => {
    if (introPlayedRef.current) return;
    introPlayedRef.current = true;
    if (!recordingStartedRef.current) {
      await initializeBotAudioRecording();
    }

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
        const audio = new Audio();
        const introData = await getItemByIdIntroConclude(1, "intro_conclude");
        if (!introData?.data?.intro_blob) {
          throw new Error("Intro audio blob not found");
        }
        audio.src = URL.createObjectURL(introData.data.intro_blob as Blob);

        if (isIOSDevice) {
          audio.load();
        }

        let introAudioTime = await getDuration(
          interviewData?.intro_dailog_audio_url
        );
        setBotSpeechDuration(introAudioTime as number);
        setBotSpeechRendered(false);
        setTimeout(() => {
          setBotSpeechRendered(true);
        }, 1);

        if (pathname.includes("/source-device-mobile") || isIOSDevice) {
          const playPromise = (async () => {
            try {
              await playWithInjection(audio);
            } catch (e) {
              await audio.play();
            }
          })();
          if (playPromise !== undefined) {
            playPromise.catch((e) => {
              document.addEventListener("click", () => audio.play(), {
                once: true,
              });
            });
          }
        } else {
          await playWithInjection(audio);
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

      await playWithInjection(audio);

      let introAudioTime = await getDuration(
        interviewData?.intro_dailog_audio_url
      );

      setBotSpeechDuration(introAudioTime as number);
      setBotSpeechRendered(false);
      setTimeout(() => {
        setBotSpeechRendered(true);
      }, 1);
      setTimeout(
        () => {
          startRec();
        },
        (introAudioTime as number) * 1000
      );

      setTimeout(
        () => {
          setIsInterviewStarted(true);
          setTimer(0);
        },
        (introAudioTime as number) * 1000 + 1000
      );
    }
  };

  const capturedImagesRef = useRef(capturedImages);

  useEffect(() => {
    capturedImagesRef.current = capturedImages;
  }, [capturedImages]);

  const interviewUserImages = async () => {
    if (
      imageCaputureApiCall === true ||
      imageCaputureApiCallRef.current === true
    )
      return;
    const currentCapturedImages = capturedImagesRef.current;
    if (!currentCapturedImages?.length) return;

    try {
      const uploadPromises = currentCapturedImages.map((face) =>
        interviewUserImagesAPI({
          payload: {
            file_name: face.fileName,
            base64: face.base64,
          },
          interviewId: interview_id as string,
          candidateCode: candidate_code as string,
        })
      );
      imageCaputureApiCallRef.current = true;
      const allResponses =
        await Promise.all<Promise<{ status: number }>>(uploadPromises);
      const failedUploads = allResponses.filter(
        (response) => ![200, 201].includes(response.status)
      );

      if (failedUploads.length > 0) {
        throw new Error(`${failedUploads.length} image uploads failed`);
      }
      const firstResponse = allResponses[0] as { status: number; data: any };
      return firstResponse?.data?.data?.file_key;
    } catch (error) {
      errPopper(error);
      console.error("Error uploading interview images:", error);
      throw error;
    } finally {
      imageCaputureApiCallRef.current = true;
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

  const startSubmittingInterview = async ({
    lastQuestionEndTime,
  }: {
    lastQuestionEndTime: string;
  }) => {
    try {
      if (interviewCompleted) return;

      stopBotAudioRecording();

      const now = Date.now();
      const updateIntervals = (
        intervals: { awayTime: number; inTime: number | null }[]
      ) => {
        return intervals.map((interval) =>
          interval.inTime === null ? { ...interval, inTime: now } : interval
        );
      };

      const updatedVideoTimeIntervals = updateIntervals([
        ...counts.videoTimeIntervals,
      ]);
      const updatedAudioTimeIntervals = updateIntervals([
        ...counts.audioTimeIntervals,
      ]);
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

      if (
        interviewType !== "MCQ" &&
        questionNo > 0 &&
        questionAns[questionNo - 1]
      ) {
        questionAns[questionNo - 1].end_time = lastQuestionEndTime;
      }

      const firstQuesStartTime =
        interviewType === "MCQ"
          ? (interviewTimes?.firstQuestionTime?.toISOString() ??
            dayjs().toISOString())
          : (questionsWithTimeStamps[0]?.start_time ?? dayjs().toISOString());

      const lastQuesEndTime =
        interviewType === "MCQ"
          ? (interviewTimes?.lastQuestionTime?.toISOString() ??
            dayjs().toISOString())
          : (questionsWithTimeStamps[questionsWithTimeStamps.length - 1]
              ?.end_time ?? lastQuestionEndTime);

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
                difficulty: qtn.difficulty,
              }));

      const totalDurationInMins =
        (new Date(lastQuesEndTime).getTime() -
          new Date(firstQuesStartTime).getTime()) /
        1000 /
        60;

      const calculateTotalTime = (intervals: any[]) => {
        return (
          Math.round(
            intervals.reduce(
              (acc, interval) =>
                acc +
                (interval.inTime !== null
                  ? (interval.inTime - interval.awayTime) / 1000
                  : 0),
              0
            ) * 100
          ) / 100
        );
      };

      const totalTabSwitchingTime = calculateTotalTime(updatedTimeIntervals);
      const totalCameraDisablingTime = counts.video * 5;
      const totalMicMutingTime = calculateTotalTime(updatedAudioTimeIntervals);

      const calculateTotalEyeTime = (
        intervals: { inTime: number | null; awayTime: number }[]
      ) =>
        Math.round(
          intervals.reduce(
            (acc, interval) =>
              acc +
              (interval.inTime !== null
                ? (interval.inTime - interval.awayTime) / 1000
                : 0),
            0
          ) * 100
        ) / 100;
      let imageFileKey = null;
      if (imageCaputureApiCallRef.current === false) {
        imageFileKey = await interviewUserImages();
      }

      setImageCaputureApiCall(true);

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
          multiple_face_detected:
            detectionCounts.current.multiple_face_detected_count >= 1,
          multiple_face_detected_count:
            detectionCounts.current.multiple_face_detected_count,
          multiple_face_detected_time: calculateTotalEyeTime(
            eyeTimeIntervals.multiFaces
          ),
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

  const audioDataRef = useRef<HTMLAudioElement | null>(null);
  const preloadFirstQuestionAudio = async (): Promise<void> => {
    if (!questions?.[0]?.qtn_audio_url || preloadedFirstQuestionAudio) {
      return;
    }

    const maxAttempts = MAX_AUDIO_PRELOAD_ATTEMPTS;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const audio = new Audio();
        audio.preload = "auto";
        audio.src = questions[0].qtn_audio_url;
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Audio preload timeout on attempt ${attempt}`));
          }, 3000);

          const onCanPlayThrough = () => {
            clearTimeout(timeout);
            audio.removeEventListener("canplaythrough", onCanPlayThrough);
            audio.removeEventListener("error", onError);
            resolve(audio);
          };

          const onError = (e: Event) => {
            clearTimeout(timeout);
            audio.removeEventListener("canplaythrough", onCanPlayThrough);
            audio.removeEventListener("error", onError);
            reject(e);
          };

          audio.addEventListener("canplaythrough", onCanPlayThrough);
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
          console.error(
            `Audio play test failed on attempt ${attempt}:`,
            playError
          );
          if (attempt === maxAttempts) {
            throw playError;
          }
        }
      } catch (error) {
        console.error(`Audio preload attempt ${attempt} failed:`, error);
        if (attempt === maxAttempts) {
          console.error(
            "All audio preload attempts failed, will try fallback during playback"
          );
          setAudioPreloadAttempts(attempt);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  const onIOSPlayClick: OnIOSPlayClickType = async (audio, event) => {
    try {
      setUserInteractionCaptured(true);
      if (!recordingStartedRef.current) {
        await initializeBotAudioRecording();
      }
      if (audio) {
        try {
          await playWithInjection(audio);
        } catch (e) {
          console.error("Intro audio play failed:", e);
          await audio.play();
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

        if (
          questionNo === 0 &&
          preloadedFirstQuestionAudio &&
          userInteractionCaptured
        ) {
          audio = preloadedFirstQuestionAudio;
          currentAudioRef.current = audio;
          audioDataRef.current = audio;
          audio.currentTime = 0;
        } else {
          audio = new Audio();
          currentAudioRef.current = audio;
          audioDataRef.current = audio;

          const audioSrc =
            questions[questionNo]?.audio ||
            questions[questionNo]?.qtn_audio_url;

          if (audioSrc) {
            const blobUrl =
              typeof audioSrc === "string"
                ? audioSrc
                : URL.createObjectURL(audioSrc);
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

        const duration: any = await getDuration(
          questions[questionNo]?.qtn_audio_url
        );

        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setShowNextButtonOrNot(true);
          setRenderTypeWriter(true);
        };

        if (isIOSDevice || pathname.includes("/source-device-mobile")) {
          const attemptPlay = async (retryCount = 0) => {
            try {
              await playWithInjection(audio);
            } catch (e) {
              console.error(
                "iOS audio play failed:",
                e,
                "Retry count:",
                retryCount
              );

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
          await playWithInjection(audio);
        }

        setRenderTypeWriter(true);
        const safariDelayMultiplier = isSafariBrowser ? 1.2 : 1;

        setTimeout(
          () => {
            setShowNextButtonOrNot(true);
          },
          duration * 1000 * safariDelayMultiplier + 2000
        );

        if (interviewType !== "MCQ") {
          setTimeout(
            () => {
              setTimer1(true);
              startCountdown();
            },
            duration * 1000 * safariDelayMultiplier
          );
        }

        const timeStamp = dayjs().toISOString();
        setQuestionsWithTimeStamps((prev) => {
          const newQuestion = {
            qtn: questions[questionNo]?.qtn,
            start_time: timeStamp,
            end_time: "",
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
      await getDurationByQuestionAudio();
      let duration: any = await getDuration(
        questions[questionNo]?.qtn_audio_url
      );

      if (questionNo !== questions.length) {
        setTimeout(
          () => {
            setShowNextButtonOrNot(true);
          },
          duration * 1000 + 2000
        );
        setTimeout(() => {
          if (interviewType != "MCQ") {
            setTimer1(true);
            startCountdown();
          }
        }, duration * 1000);
      }

      if (questionNo == 0) {
        const timeOfStart = dayjs().toISOString();
        setQuestionsWithTimeStamps([
          {
            qtn: questions[0]?.qtn,
            start_time: timeOfStart,
            end_time: "",
            id: questions[0]?.id,
            difficulty: questions[questionNo]?.difficulty,
          },
        ]);
        const audio = new Audio();

        if (
          questions[questionNo]?.audio ||
          questions[questionNo]?.qtn_audio_url
        ) {
          const srcCandidate =
            questions[questionNo]?.audio ||
            questions[questionNo]?.qtn_audio_url ||
            "";
          audio.src =
            typeof srcCandidate === "string"
              ? (srcCandidate as string)
              : URL.createObjectURL(srcCandidate as Blob);
        }
        await playWithInjection(audio);
      } else {
        const timeOfQuestion = dayjs().toISOString();
        let tempQuestions = [...questionsWithTimeStamps];
        const presentQuestion = {
          qtn: questions[questionNo]?.qtn,
          start_time: timeOfQuestion,
          end_time: "",
          id: questions[questionNo]?.id,
          difficulty: questions[questionNo]?.difficulty,
        };
        tempQuestions = [...tempQuestions, presentQuestion];

        setQuestionsWithTimeStamps(tempQuestions);
        const audio = new Audio();

        if (
          questions[questionNo]?.qtn_audio_url ||
          questions[questionNo]?.audio
        ) {
          const srcCandidate =
            questions[questionNo]?.audio ||
            questions[questionNo]?.qtn_audio_url ||
            "";
          audio.src =
            typeof srcCandidate === "string"
              ? (srcCandidate as string)
              : URL.createObjectURL(srcCandidate as Blob);
        }
        await playWithInjection(audio);
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
      stopBotAudioRecording();
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
              submitInterviewForTesting();
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
            if (
              interviewType === "MCQ" &&
              questionNo === questions.length - 1
            ) {
              submitInterviewForTesting();
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
            submitInterviewForTesting();
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

    await playWithInjection(audio);

    let concludeAudioTime = await getDuration(
      interviewData?.conclude_dailog_audio_url
    );
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
    if (
      isInterviewStarted &&
      questions.length &&
      questionNo >= questions.length
    ) {
      setQuestions([]);
      playConclude();
    }
  }, [questionNo, isInterviewStarted]);

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
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      stopBotAudioRecording();
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
        interviewQuestions[interviewQuestions.length - 1].end_time =
          parsedData.timestamp123;
      }

      const remainingQuestions = questions
        .slice(interviewQuestions.length)
        .map((qtn) => ({
          qtn: qtn.qtn,
          id: qtn.id,
          start_time: parsedData.timestamp123,
          end_time: parsedData.timestamp123,
          difficulty: qtn.difficulty,
        }));

      const allQuestions = [...interviewQuestions, ...remainingQuestions];

      let updatedDuration = null;
      if (allQuestions.length > 0) {
        const firstQuestionStart = dayjs(allQuestions[0].start_time);
        const lastQuestionEnd = dayjs(
          allQuestions[allQuestions.length - 1].end_time
        );
        updatedDuration = lastQuestionEnd.diff(firstQuestionStart, "seconds");
      }

      const startSubmittingInterview2 = async () => {
        try {
          if (interviewCompleted) return;
          stopBotAudioRecording();
          const now = Date.now();
          const updateIntervals = (
            intervals: { awayTime: number; inTime: number | null }[]
          ) => {
            return intervals.map((interval) =>
              interval.inTime === null ? { ...interval, inTime: now } : interval
            );
          };

          const updatedVideoTimeIntervals = updateIntervals([
            ...counts.videoTimeIntervals,
          ]);
          const updatedAudioTimeIntervals = updateIntervals([
            ...counts.audioTimeIntervals,
          ]);
          const updatedTimeIntervals = updateIntervals([
            ...counts.timeIntervals,
          ]);

          setCounts((prevCounts) => ({
            ...prevCounts,
            videoTimeIntervals: updatedVideoTimeIntervals,
            audioTimeIntervals: updatedAudioTimeIntervals,
            timeIntervals: updatedTimeIntervals,
          }));

          setSubmittingInterview(true);
          let lastQuestionEndTime = dayjs().toISOString();
          const lastQuestionTime = dayjs().toISOString();

          const firstQuesStartTime = allQuestions[0].start_time;
          const lastQuesEndTime =
            allQuestions[allQuestions.length - 1].end_time || lastQuestionTime;
          const totalDurationInMins =
            (new Date(lastQuesEndTime).getTime() -
              new Date(firstQuesStartTime).getTime()) /
            1000 /
            60;

          const calculateTotalTime = (intervals: any[]) => {
            return (
              Math.round(
                intervals.reduce(
                  (acc, interval) =>
                    acc +
                    (interval.inTime !== null
                      ? (interval.inTime - interval.awayTime) / 1000
                      : 0),
                  0
                ) * 100
              ) / 100
            );
          };

          const totalTabSwitchingTime =
            calculateTotalTime(updatedTimeIntervals);
          const totalCameraDisablingTime = counts.video * 5;
          const totalMicMutingTime = calculateTotalTime(
            updatedAudioTimeIntervals
          );

          const calculateTotalEyeTime = (
            intervals: { inTime: number | null; awayTime: number }[]
          ) =>
            Math.round(
              intervals.reduce(
                (acc, interval) =>
                  acc +
                  (interval.inTime !== null
                    ? (interval.inTime - interval.awayTime) / 1000
                    : 0),
                0
              ) * 100
            ) / 100;

          const { eyeTimeIntervals } = detectionCounts.current;
          let imageFileKey = null;
          if (imageCaputureApiCallRef.current === false) {
            imageFileKey = await interviewUserImages();
          }
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
              total_eye_right_time: calculateTotalEyeTime(
              eyeTimeIntervals.right
              ),
              total_eye_left_time: calculateTotalEyeTime(eyeTimeIntervals.left),
              total_eye_up_time: calculateTotalEyeTime(eyeTimeIntervals.up),
              total_eye_down_time: calculateTotalEyeTime(eyeTimeIntervals.down),
              multiple_face_detected:
              detectionCounts.current.multiple_face_detected_count >= 1,
              multiple_face_detected_count:
              detectionCounts.current.multiple_face_detected_count,
              multiple_face_detected_time: calculateTotalEyeTime(
                eyeTimeIntervals.multiFaces
              ),
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

  if (counts.video >= 3 || videoStreamOff) {
    setEndCall && setEndCall(true);
  }

  useEffect(() => {
    const isValidDuration =
      interviewData?.duration && interviewData.duration > 0;
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
  };
};

export default useQuestionsHook;