// ============================
// file: useMixedAudioRecorder.ts
// React hook to mix mic stream + bot audio (AudioBuffer-based) and produce a WAV file
// Exports: useMixedAudioRecorder
// Usage: const {start, stop, getBlob, isRecording, getTimestamps} = useMixedAudioRecorder()
// ============================

import { useRef, useState, useEffect } from "react";

type Timestamp = { label: string; timeMs: number };

export function useMixedAudioRecorder() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const botSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // For WAV export
  const recorderBufferRef = useRef<Float32Array[]>([]);
  const recordingLengthRef = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);

  // Provide a way to feed bot AudioBuffer (decoded PCM) into the mixer
  const botNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Create or reuse AudioContext
  const ensureAudioContext = async () => {
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") return audioCtxRef.current;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioCtxRef.current = ctx;
    return ctx;
  };

  const start = async (micStream: MediaStream | null, opts?: { mimeType?: string }) => {
    if (isRecording) return;
    const ctx = await ensureAudioContext();

    // destination for mixing
    const destination = ctx.createMediaStreamDestination();
    destinationRef.current = destination;

    // connect mic stream
    if (micStream) {
      const micSource = ctx.createMediaStreamSource(micStream);
      micSourceRef.current = micSource;
      const micGain = ctx.createGain();
      micGain.gain.value = 1.0;
      micSource.connect(micGain);
      micGain.connect(destination);

      // also connect to ScriptProcessor / AudioWorklet to capture raw PCM for WAV
      const bufferSize = 4096;
      if ((ctx as any).createScriptProcessor) {
        const scriptNode = (ctx as any).createScriptProcessor(bufferSize, 1, 1);
        micSource.connect(scriptNode);
        scriptNode.connect(ctx.destination);
        scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
          const input = e.inputBuffer.getChannelData(0);
          recorderBufferRef.current.push(new Float32Array(input));
          recordingLengthRef.current += input.length;
        };
      } else {
        // fallback: rely on MediaRecorder chunks for WAV generation
      }
    }

    // Bot source will be connected by `feedBotAudioBuffer` when available

    // Setup MediaRecorder for fallback and quick download (webm/opus)
    const mimeType = opts?.mimeType || "audio/webm;codecs=opus";
    const recorder = new MediaRecorder(destination.stream, { mimeType });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    recorder.onstop = () => {
      // produce final webm from chunks as a fallback
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setResultBlob(blob);
    };

    recorder.start(1000);

    setIsRecording(true);
    setTimestamps([]);
    recorderBufferRef.current = [];
    recordingLengthRef.current = 0;
  };

  // Feed decoded AudioBuffer from Gemini TTS into the shared AudioContext
  const feedBotAudioBuffer = async (audioBuffer: AudioBuffer, label?: string) => {
    const ctx = await ensureAudioContext();
    if (!destinationRef.current) {
      // If recording hasn't started, create destination so bot can be heard
      const destination = ctx.createMediaStreamDestination();
      destinationRef.current = destination;
    }

    // create source
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    // connect to destination so MediaRecorder captures it
    source.connect(destinationRef.current as MediaStreamAudioDestinationNode);

    // Also connect to ctx.destination so user can hear bot (if allowed)
    source.connect(ctx.destination);

    // Capture raw PCM for WAV: tap via ScriptProcessor if available
    if ((ctx as any).createScriptProcessor) {
      const scriptNode = (ctx as any).createScriptProcessor(4096, audioBuffer.numberOfChannels, 1);
      source.connect(scriptNode);
      scriptNode.connect(ctx.destination);
      scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
        const input = e.inputBuffer.getChannelData(0);
        recorderBufferRef.current.push(new Float32Array(input));
        recordingLengthRef.current += input.length;
      };
    }

    source.start();

    // store timestamp of bot utterance start
    setTimestamps((prev) => [...prev, { label: label || "bot-utterance", timeMs: Date.now() }]);

    // return promise which resolves when finished
    return new Promise<void>((resolve) => {
      source.onended = () => {
        // store an end timestamp
        setTimestamps((prev) => [...prev, { label: (label || "bot-utterance") + "-end", timeMs: Date.now() }]);
        resolve();
      };
    });
  };

  const addTimestamp = (label: string) => {
    setTimestamps((prev) => [...prev, { label, timeMs: Date.now() }]);
  };

  // Stop recording and produce WAV file (mixed)
  const stop = async () => {
    if (!isRecording) return;
    setIsRecording(false);

    // stop mediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Build WAV from recorderBufferRef if have PCM captured
    try {
      const ctx = audioCtxRef.current;
      if (recorderBufferRef.current.length === 0) {
        // fallback: use webm blob
        const webmBlob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || "audio/webm" });
        setResultBlob(webmBlob);
        return;
      }

      // merge Float32Array chunks into single float array
      const totalLen = recordingLengthRef.current;
      const result = new Float32Array(totalLen);
      let offset = 0;
      for (let i = 0; i < recorderBufferRef.current.length; i++) {
        result.set(recorderBufferRef.current[i], offset);
        offset += recorderBufferRef.current[i].length;
      }

      // convert float to 16-bit PCM
      const wavBuffer = encodeWAV(result, ctx!.sampleRate);
      const blob = new Blob([wavBuffer], { type: "audio/wav" });
      setResultBlob(blob);
    } catch (err) {
      console.error("WAV creation failed, falling back to webm:", err);
      const webmBlob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || "audio/webm" });
      setResultBlob(webmBlob);
    } finally {
      // cleanup
      try {
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          await audioCtxRef.current.close();
        }
      } catch {}
      audioCtxRef.current = null;
      destinationRef.current = null;
      micSourceRef.current = null;
      botSourceRef.current = null;
    }
  };

  const getBlob = () => resultBlob;
  const getTimestamps = () => timestamps;

  useEffect(() => {
    return () => {
      // cleanup
      try {
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    };
  }, []);

  return { start, stop, feedBotAudioBuffer, getBlob, isRecording, addTimestamp, getTimestamps };
}

// WAV encoder helper (16-bit PCM, mono)
function encodeWAV(samples: Float32Array, sampleRate = 24000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */ writeString(view, 0, "RIFF");
  /* file length */ view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */ writeString(view, 8, "WAVE");
  /* format chunk identifier */ writeString(view, 12, "fmt ");
  /* format chunk length */ view.setUint32(16, 16, true);
  /* sample format (raw) */ view.setUint16(20, 1, true);
  /* channel count */ view.setUint16(22, 1, true);
  /* sample rate */ view.setUint32(24, sampleRate, true);
  /* byte rate (sampleRate * blockAlign) */ view.setUint32(28, sampleRate * 2, true);
  /* block align (channels * bytesPerSample) */ view.setUint16(32, 2, true);
  /* bits per sample */ view.setUint16(34, 16, true);
  /* data chunk identifier */ writeString(view, 36, "data");
  /* data chunk length */ view.setUint32(40, samples.length * 2, true);

  // write the PCM samples
  floatTo16BitPCM(view, 44, samples);

  return view;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}


// ============================
// file: GeminiInterviewBotWithMixer.tsx
// A component that runs your Gemini live conversation and pipes the bot's audio into the mixer
// It uses useMixedAudioRecorder above. It does NOT make the bot join VideoSDK. Instead it produces a WAV
// You will import and use this component inside MeetingView when interviewType === 'SURVEY'
// ============================

import React  from "react";
import { GoogleGenAI, Modality, StartSensitivity, EndSensitivity } from "@google/genai";
// import { useMixedAudioRecorder } from "./useMixedAudioRecorder";

export default function GeminiInterviewBotWithMixer({ onWavReady }: { onWavReady?: (blob: Blob | null) => void }) {
  const { start, stop, feedBotAudioBuffer, getBlob, isRecording, addTimestamp, getTimestamps } = useMixedAudioRecorder();
  const sessionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [started, setStarted] = useState(false);

  // Helper: decode base64 PCM/opus to AudioBuffer
  async function decodeBase64ToAudioBuffer(base64: string) {
    // If Gemini returns raw PCM16 base64 at 24k or opus/webm base64, you'll need to handle accordingly.
    // Here we'll assume base64 is raw 16-bit PCM at 24000 Hz mono OR a webm/ogg chunk. We attempt to decode using AudioContext.decodeAudioData
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    try {
      const ab = await ctx.decodeAudioData(bytes.buffer.slice(0));
      return ab;
    } catch (err) {
      console.warn("decodeAudioData failed: trying PCM16->AudioBuffer conversion", err);
      // Try PCM16 -> float decode
      const dv = new DataView(bytes.buffer);
      const samples = new Float32Array(bytes.length / 2);
      for (let i = 0; i < samples.length; i++) {
        const v = dv.getInt16(i * 2, true);
        samples[i] = v / 32768;
      }
      const buffer = ctx.createBuffer(1, samples.length, 24000);
      buffer.getChannelData(0).set(samples);
      return buffer;
    }
  }

  const startInterview = async () => {
    if (started) return;
    setStarted(true);

    // get mic
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current = micStream;

    // start mixer recorder
    await start(micStream, { mimeType: "audio/webm;codecs=opus" });

    // connect to Gemini
    const apiResponse = await fetch("/api/get-ephemeral-token");
    const { ephemeralToken } = await apiResponse.json();

    const ai = new GoogleGenAI({ apiKey: ephemeralToken, httpOptions: { apiVersion: "v1alpha" } });
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
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Achernar" } }, languageCode: "en-US" },
      },
      callbacks: {
        onmessage: async (message: any) => {
          // message.data likely contains base64-encoded audio payloads
          if (message.data) {
            // feed into mixer
            try {
              const ab = await decodeBase64ToAudioBuffer(message.data);
              await feedBotAudioBuffer(ab, "question");
            } catch (err) {
              console.error("Failed to decode and feed bot audio:", err);
            }
          }

          // transcription handling
          const fragment = message?.serverContent?.outputTranscription?.text;
          if (fragment) {
            // detect question boundary and add timestamp
            if (/[?]$/.test(fragment.trim())) {
              addTimestamp("question-start");
            }
          }
        },
        onerror: (err: any) => console.error(err),
        onclose: () => (sessionRef.current = null),
      },
    });

    sessionRef.current = session;
    // send initial prompt
    try {
      session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "start" }] }], turnComplete: true });
    } catch (err) {
      console.error("initial start error", err);
    }
  };

  const stopInterview = async () => {
    try {
      if (sessionRef.current) await sessionRef.current.close();
    } catch {}
    sessionRef.current = null;
    await stop();
    setStarted(false);
    const wav = getBlob();
    if (onWavReady) onWavReady(wav || null);
  };

  return (
    <div>
      <button onClick={startInterview} disabled={started} className="btn">
        Start Gemini Interview (local mix)
      </button>
      <button onClick={stopInterview} disabled={!started} className="btn">
        Stop Interview & Produce WAV
      </button>
    </div>
  );
}


// ============================
// file: MeetingView integration notes
// ============================

/*
  Usage in your MeetingView:

  import GeminiInterviewBotWithMixer from "./GeminiInterviewBotWithMixer";

  // inside JSX where interviewType === 'SURVEY'
  <GeminiInterviewBotWithMixer onWavReady={(blob) => {
    // blob is either a WAV (preferred) or webm fallback
    // you can upload it to your server for storage/analysis
    const form = new FormData();
    form.append('file', blob, `interview_${Date.now()}.wav`);
    fetch('/api/upload-interview', { method: 'POST', body: form });
  }} />

  Important:
  - Keep VideoSDK recording (server or client) active to capture proctoring telemetry + participant webcam/audio.
  - This hook records mixed audio locally (bot + candidate) producing a WAV you can store and link to the VideoSDK session/timestamps.
  - Use the timestamps produced by the useMixedAudioRecorder (getTimestamps()) to merge with VideoSDK event logs server-side if you want one unified timeline.
*/
