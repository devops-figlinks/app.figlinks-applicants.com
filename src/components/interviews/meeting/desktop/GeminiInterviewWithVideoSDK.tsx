"use client";
import { useRef, useState, useEffect } from "react";
import {
  GoogleGenAI,
  Modality,
  StartSensitivity,
  EndSensitivity,
} from "@google/genai";
// import { getTokenAPI } from "@/lib/services/aiBotInterview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { getTokenAPI } from "@/https/services/interviews";
export default function GeminiInterviewBot() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [finished, setFinished] = useState(false);
  const [volume, setVolume] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [displayedQuestion, setDisplayedQuestion] = useState<string | null>(
    null
  );
  const [questionCount, setQuestionCount] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const sessionRef = useRef<any>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const inputProcessorRef = useRef<AudioWorkletNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const recordAudioCtxRef = useRef<AudioContext | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const questionCountRef = useRef(0);
  const sharedAudioContextRef = useRef<AudioContext | null>(null);
  const sharedDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(
    null
  );
  const transcriptionBufferRef = useRef<string>("");

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isBotSpeakingRef = useRef(false);
  const lastVolumeRef = useRef(0);
  const silenceStartTimeRef = useRef<number | null>(null);
  const silenceCounterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const SILENCE_THRESHOLD = 0.01;
  const SILENCE_DURATION = 10000;

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (silenceCounterIntervalRef.current) {
      clearInterval(silenceCounterIntervalRef.current);
      silenceCounterIntervalRef.current = null;
    }

    silenceStartTimeRef.current = null;
  };

  const startSilenceDetection = () => {
    clearSilenceTimer();
    let counter = 0;

    silenceCounterIntervalRef.current = setInterval(() => {
      counter += 1;
    }, 1000);

    silenceTimerRef.current = setTimeout(() => {

      if (silenceCounterIntervalRef.current) {
        clearInterval(silenceCounterIntervalRef.current);
        silenceCounterIntervalRef.current = null;
      }

      // send message
      if (sessionRef.current) {
        try {
          sessionRef.current.sendClientContent({
            turns: [
              {
                role: "user",
                parts: [
                  {
                    text: "The user stayed silent. Say only this: 'I didn't get any answer, so I'm moving to the next question.' Then immediately ask the next interview question. Do not repeat earlier questions. If it was your last question, give a short closing message and end the interview.",
                  },
                ],
              },
            ],
            turnComplete: true,
          });
        } catch (err) {
          console.error("Error sending silence prompt:", err);
        }
      }
    }, SILENCE_DURATION);
  };

  const playAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    isBotSpeakingRef.current = true;
    setIsSpeaking(true);
    clearSilenceTimer();
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    try {
      while (audioQueueRef.current.length > 0) {
        const chunk = audioQueueRef.current.shift()!;
        await playChunk(chunk);
      }
    } catch (err) {
      console.error("Queue play error:", err);
    }

    isPlayingRef.current = false;
    isBotSpeakingRef.current = false;
    setIsSpeaking(false);
    setTimeout(() => {
      startSilenceDetection();
    }, 5000);
  };

  let nextTime = 0;

  const playChunk = async (base64Data: string) => {
    const ctx = sharedAudioContextRef.current;
    if (!ctx) return;

    if (ctx.state === "suspended") await ctx.resume();

    const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const samples = new Int16Array(bytes.buffer);

    const audioBuffer = ctx.createBuffer(1, samples.length, 24000);
    const channel = audioBuffer.getChannelData(0);

    for (let i = 0; i < samples.length; i++) {
      channel[i] = samples[i] / 32768;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    // User can hear the bot voice
    source.connect(ctx.destination);

    // 🔥 FIX: include bot audio in recorder output
    if (sharedDestinationRef.current) {
      source.connect(sharedDestinationRef.current);
    }

    if (nextTime < ctx.currentTime) {
      nextTime = ctx.currentTime + 0.15;
    }

    source.start(nextTime);
    nextTime += audioBuffer.duration;
  };

  const stopGeminiSession = async () => {
    clearSilenceTimer();
    try {
      if (sessionRef.current) {
        await sessionRef.current.close();
      }
    } catch (err) {
      console.warn("Session already closed:", err);
    }
    sessionRef.current = null;
    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach((t) => {
          if (t.readyState !== "ended") t.stop();
        });
      } catch (err) {
        console.warn("Error stopping mic tracks:", err);
      }
    }
    micStreamRef.current = null;
    try {
      if (inputProcessorRef.current) {
        inputProcessorRef.current.disconnect();
      }
    } catch (err) {
      console.warn("Processor disconnect error:", err);
    }
    inputProcessorRef.current = null;

    try {
      if (micSourceRef.current) {
        micSourceRef.current.disconnect();
      }
    } catch (err) {
      console.warn("micSource disconnect error:", err);
    }
    micSourceRef.current = null;
    try {
      if (
        inputAudioCtxRef.current &&
        inputAudioCtxRef.current.state !== "closed"
      ) {
        await inputAudioCtxRef.current.close();
      }
    } catch (err) {
      console.warn("Input ctx close error:", err);
    }
    inputAudioCtxRef.current = null;

    try {
      if (
        recordAudioCtxRef.current &&
        recordAudioCtxRef.current.state !== "closed"
      ) {
        await recordAudioCtxRef.current.close();
      }
    } catch (err) {
      console.warn("Record ctx close error:", err);
    }
    recordAudioCtxRef.current = null;
    analyserRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = null;
    audioQueueRef.current = [];

  };

  const startMicAndRecorder = async () => {
    if (micStreamRef.current) return;

    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    micStreamRef.current = micStream;

    const sharedCtx = new AudioContext({
      sampleRate: 24000,
      latencyHint: "interactive",
    });
    sharedAudioContextRef.current = sharedCtx;
    audioContextRef.current = sharedCtx;
    recordAudioCtxRef.current = sharedCtx;

    const destination = sharedCtx.createMediaStreamDestination();
    sharedDestinationRef.current = destination;
    destinationRef.current = destination;

    const micSource = sharedCtx.createMediaStreamSource(micStream);
    const micGain = sharedCtx.createGain();
    micGain.gain.value = 0.9;

    micSource.connect(micGain);
    micGain.connect(destination);
    const recorder = new MediaRecorder(destination.stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const finalBlob = new Blob(chunksRef.current, {
        type: "audio/webm;codecs=opus",
      });

      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview_${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      setIsRecording(false);
      setFinished(true);
      stopGeminiSession();
    };

    recorder.start();
    setIsRecording(true);
    const inputCtx = new AudioContext({ sampleRate: 16000 });
    inputAudioCtxRef.current = inputCtx;

    const inputMicSource = inputCtx.createMediaStreamSource(micStream);
    micSourceRef.current = inputMicSource;
    const analyser = inputCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    inputMicSource.connect(analyser);
    await inputCtx.audioWorklet.addModule("/worklet/input-processor.js");
    const processor = new AudioWorkletNode(inputCtx, "input-processor");

    processor.port.onmessage = (event) => {
      const float32PCM = event.data;

      const buffer = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(buffer);

      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buffer.length);
      setVolume(rms);
      lastVolumeRef.current = rms;
      if (rms > SILENCE_THRESHOLD && !isBotSpeakingRef.current) {
        clearSilenceTimer();
        silenceStartTimeRef.current = null;
      } else if (rms <= SILENCE_THRESHOLD && !isBotSpeakingRef.current) {
        if (silenceStartTimeRef.current === null) {
          silenceStartTimeRef.current = Date.now();
        }
      }

      const int16 = new Int16Array(float32PCM.length);
      for (let i = 0; i < float32PCM.length; i++) {
        let s = Math.max(-1, Math.min(1, float32PCM[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const base64 = btoa(
        Array.from(new Uint8Array(int16.buffer))
          .map((b) => String.fromCharCode(b))
          .join("")
      );
      sessionRef.current?.sendRealtimeInput({
        audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
      });
    };
    inputMicSource.connect(processor);
    processor.connect(inputCtx.destination);

    inputProcessorRef.current = processor;
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
  };

  const onMessage = (message: any) => {
    const userSpeech = message?.serverContent?.inputTranscription?.text;
    if (userSpeech) {
    }
    if (message.data) {
      audioQueueRef.current.push(message.data);
      playAudioQueue();
    }
    const fragment = message?.serverContent?.outputTranscription?.text;
    let mergedText = "";

    if (fragment) {
      transcriptionBufferRef.current += fragment + " ";
      mergedText = transcriptionBufferRef.current.trim();
      setDisplayedQuestion(mergedText);

      if (/[?]$/.test(mergedText)) {
        setQuestions((prev) => [...prev, mergedText]); // store Q1, Q2, Q3...
        transcriptionBufferRef.current = ""; // clear buffer for next question
      }
    }

    let botText = "";

    if (botText.trim().length > 0) {
    }
    const cleaned = mergedText
      .replace(/\s+/g, " ")
      .replace(/[^\w\s!?.]/g, "")
      .toLowerCase();

    if (cleaned.includes("have a great day")) {
      setTimeout(() => {
        mediaRecorderRef.current?.stop();
        sessionRef.current?.close();
        stopMicAndRecorder();
      }, 5000);
    }
  };

  const connectToGemini = async () => {
    const apiResponse = await getTokenAPI();
    const ephemeralToken = apiResponse?.data?.ephemeralToken;
    const ai = new GoogleGenAI({
      apiKey: ephemeralToken?.name,
      httpOptions: { apiVersion: "v1alpha" },
    });
    const session = await ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      config: {
        responseModalities: [Modality.AUDIO],
        realtimeInputConfig: {
          automaticActivityDetection: {
            startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            silenceDurationMs: 1200,
          },
        },
        contextWindowCompression: { slidingWindow: {} },

        systemInstruction:
          "You are a professional HR interviewer conducting a job interview. Your role is to:\n" +
          "- Ask thoughtful, relevant interview questions one at a time. Every question must end with question mark ?\n" +
          "- Listen carefully to candidate responses\n" +
          "- Ask follow-up questions based on their answers\n" +
          "- Maintain a professional yet friendly tone\n" +
          "- Keep your questions concise and clear\n" +
          "- Cover topics like: work experience, skills, problem-solving abilities, and cultural fit\n" +
          "- IMPORTANT: You are the INTERVIEWER. You ask questions, you don't answer them. The candidate will respond to your questions.\n" +
          "- Start by greeting the candidate and asking them to introduce themselves.\n" +
          "- You will ask exactly 5 questions total during this interview.\n" +
          "- After the 5th question is answered, thank the candidate and conclude the interview professionally." +
          "- End the interview with have a great day" +
          "- Always speak only in English (en-US). Do not use any other language under any circumstance. Even if the user speaks another language, always reply only in English." +
          " If you receive a message indicating the user is silent or did not answer, you must politely ask the next interview question immediately.",

        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Achernar" },
          },
          languageCode: "en-US",
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: any) => {
          onMessage(message);
        },

        onerror: (err: any) => {
          console.error("Gemini live error:", err);
        },
        onclose: (ev: any) => {
          sessionRef.current = null;
        },
      },
    });
    sessionRef.current = session;
    try {
      session.sendClientContent({
        turns: [{ role: "user", parts: [{ text: "start" }] }],
        turnComplete: true,
      });
    } catch (err) {
      console.error("Error sending initial start message post-connect:", err);
    }
  };

  const stopMicAndRecorder = () => {
    try {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
    } catch (err) {}
    setIsRecording(false);
    setFinished(true);
  };

  const startInterview = async () => {
    try {
      setInterviewStarted(true);
      setUploadError(null);
      setFinished(false);
      setDisplayedQuestion(null);
      setQuestionCount(0);
      questionCountRef.current = 0;
      await startMicAndRecorder();
      await connectToGemini();
    } catch (err: any) {
      console.error("Start interview failed:", err);
      setUploadError(err?.message || "Failed to start interview");
      stopMicAndRecorder();
      try {
        sessionRef.current?.close();
      } catch {}
      sessionRef.current = null;
      setInterviewStarted(false);
    }
  };

  const stopInterview = () => {
    clearSilenceTimer();
    try {
      stopMicAndRecorder();
    } catch {}
    try {
      sessionRef.current?.close();
    } catch {}
    sessionRef.current = null;
    setIsRecording(false);
    setFinished(true);
  };

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      try {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      } catch {}
      try {
        stopMicAndRecorder();
      } catch {}
      try {
        sessionRef.current?.close();
      } catch {}
      sessionRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="rounded-2xl border border-[#f2f2f2] bg-white shadow-[0_0_9px_0px_rgba(0,0,0,0.14)]">
          <CardHeader className="border-b border-[#dadada] pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] p-2 rounded-lg">
                  <Image
                    src="/sparkleimage.svg"
                    alt="AI Interview"
                    width={24}
                    height={24}
                  />
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] bg-clip-text text-transparent font-medium text-xl md:text-2xl leading-[120%] capitalize">
                    AI Interview Assistant
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {interviewStarted
                      ? "Interview in progress"
                      : "Ready to begin your interview"}
                  </p>
                </div>
              </div>
              {interviewStarted && !finished && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-red-500">LIVE</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {!interviewStarted ? (
              <div className="text-center py-12">
                <div className="mx-auto bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] p-1 rounded-full w-24 h-24 flex items-center justify-center mb-6">
                  <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center">
                    <Image
                      src="/sparkleimage.svg"
                      alt="AI Interview"
                      width={40}
                      height={40}
                    />
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Welcome to Your AI Interview
                </h2>

                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  You will be asked a series of questions by our AI assistant.
                  Please answer each question verbally after the AI finishes
                  speaking. Your responses will be recorded for evaluation.
                </p>

                <div className="bg-gray-50 rounded-xl p-6 max-w-lg mx-auto mb-8">
                  <h3 className="font-medium text-gray-800 mb-3">
                    Interview Guidelines:
                  </h3>
                  <ul className="text-left text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="text-[#A533CF] mr-2">•</span>
                      <span>
                        Find a quiet environment with minimal background noise
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#A533CF] mr-2">•</span>
                      <span>Use a good quality microphone for clear audio</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#A533CF] mr-2">•</span>
                      <span>
                        Wait for the AI to finish speaking before answering
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#A533CF] mr-2">•</span>
                      <span>Answer each question clearly and concisely</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={startInterview}
                  disabled={isRecording || isSpeaking}
                  className="bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] text-white font-medium text-base px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Start Interview
                </Button>
              </div>
            ) : finished ? (
              <div className="text-center py-12">
                {uploadError ? (
                  <div className="mb-6 p-4 bg-red-50 rounded-lg">
                    <h3 className="text-lg font-medium text-red-800 mb-2">
                      Upload Error
                    </h3>
                    <p className="text-red-700">{uploadError}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  {uploadError
                    ? "Interview Completed with Error"
                    : "Interview Completed"}
                </h2>

                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  {uploadError
                    ? "Your interview was recorded but there was an issue uploading it."
                    : "Thank you for completing the interview. Your responses have been recorded and uploaded for evaluation."}
                </p>

                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] text-white font-medium text-base px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Restart Interview
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {questions.length > 0 && (
                  <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                    {questions.map((q, index) => (
                      <p key={index} className="text-md text-gray-800 mb-2">
                        <span className="font-bold">{`Q${index + 1}.`}</span>{" "}
                        {q}
                      </p>
                    ))}
                  </div>
                )}

                {/* Show current streaming question */}
                {displayedQuestion && (
                  <div className="bg-gray-50 rounded-xl p-6 shadow-inner">
                    <h3 className="font-medium text-gray-800 mb-3">
                      Current Question
                    </h3>

                    <p className="text-lg text-gray-800">{displayedQuestion}</p>
                  </div>
                )}

                {isRecording && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">
                          Recording in progress...
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {volume > 0.02 ? "Speaking" : "Silent"}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(volume * 300, 100)}%` }}
                      ></div>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                      {isSpeaking ? (
                        <p>
                          AI is speaking... Please wait for your turn to respond
                        </p>
                      ) : (
                        <p>Please proceed further</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  {isRecording && (
                    <Button
                      onClick={() => {
                        try {
                          mediaRecorderRef.current?.stop();
                        } catch {}
                        stopInterview();
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2"
                    >
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                      Stop Interview
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            AI Interview Assistant • Your responses are securely recorded and
            processed
          </p>
        </div>
      </div>
    </div>
  );
}