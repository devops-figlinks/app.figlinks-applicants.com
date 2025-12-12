// components/gemini/GeminiParticipantView.tsx
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { stringAvatar } from "@/helpers/muiAvatar";

interface GeminiParticipantViewProps {
  isSpeaking: boolean;
  volume: number; // 0 to 1
  webcamOn: boolean;
  videoStream?: MediaStream | null;
  participantName?: string;
}

export default function GeminiParticipantView({
  isSpeaking,
  volume,
  webcamOn,
  videoStream,
  participantName = "You",
}: GeminiParticipantViewProps) {
  const [mouthHeight, setMouthHeight] = useState(10);

  // Animate mouth based on bot speaking volume
  useEffect(() => {
    if (isSpeaking) {
      setMouthHeight(20 + volume * 80); // 20px → 100px
    } else {
      setMouthHeight(10);
    }
  }, [isSpeaking, volume]);

  return (
    <div className="relative h-full w-full bg-black rounded-xl overflow-hidden">
      {/* Candidate's Video */}
      {webcamOn && videoStream ? (
        <video
          autoPlay
          playsInline
          muted
          ref={(node) => {
            if (node && videoStream) node.srcObject = videoStream;
          }}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-900">
          <Avatar className="w-32 h-32" />
        </div>
      )}

      {/* AI Bot Avatar - Bottom Left */}
      <div className="absolute bottom-6 left-6 w-56 h-80 bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-purple-500">
        <div className="relative h-full flex flex-col">
          {/* Avatar Background */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* AI Avatar Image */}
          <div className="flex-1 relative flex items-center justify-center">
            <Image
              src="/ai-interviewer-avatar.png" // Put your AI avatar here
              alt="AI Interviewer"
              width={200}
              height={200}
              className="object-contain drop-shadow-2xl"
            />

            {/* Animated Mouth */}
            <div
              className="absolute bottom-16 left-1/2 -translate-x-1/2 w-20 bg-white/40 backdrop-blur rounded-full transition-all duration-75"
              style={{ height: `${mouthHeight}px` }}
            />

            {/* Speaking Indicator */}
            {isSpeaking && (
              <>
                <div className="absolute top-4 right-4 w-5 h-5 bg-green-400 rounded-full animate-pulse ring-4 ring-green-400/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent animate-pulse" />
              </>
            )}
          </div>

          {/* Name Tag */}
          <div className="bg-gradient-to-r from-[#430CA6] via-[#A533CF to-[#EC6D78] text-white text-center py-3 font-semibold text-lg">
            AI Interviewer
          </div>

          {/* Status */}
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
            {isSpeaking ? "Speaking" : "Listening"}
          </div>
        </div>
      </div>

      {/* You Label */}
      <div className="absolute top-6 right-6 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur">
        {participantName} (You)
      </div>
    </div>
  );
}