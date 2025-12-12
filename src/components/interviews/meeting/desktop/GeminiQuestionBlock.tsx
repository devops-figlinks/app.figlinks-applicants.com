// components/gemini/GeminiQuestioningBlock.tsx
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface GeminiQuestioningBlockProps {
  questions: any;
  displayedQuestion: string | null;
  isSpeaking: boolean;
  isRecording: boolean;
  onStopInterview: () => void;
  interviewTitle?: string;
}

export default function GeminiQuestioningBlock({
  questions,
  displayedQuestion,
  isSpeaking,
  isRecording,
  onStopInterview,
  interviewTitle = "AI-Powered Interview",
}: GeminiQuestioningBlockProps) {
  return (
    <div className="self-stretch flex flex-col">
      {/* Questions Panel */}
      <div className="box-border rounded-lg bg-white shadow-[0px_0px_9px_0px_rgba(0,_0,_0,_0.14)] p-5 mb-4 flex-1 overflow-hidden flex flex-col">
        <header className="border-b border-[#dadada] pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/interviews/sparkleimage.svg"
                alt="AI"
                width={20}
                height={20}
              />
              <p className="text-lg font-semibold">Live AI Question</p>
            </div>
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-600">LIVE</span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2">
          {/* Previous Questions */}
          {questions.length > 0 && (
            <div className="space-y-3 mb-6">
              {questions.map((q:any, i:any) => (
                <div key={i} className="text-gray-700">
                  <span className="font-bold text-purple-600">Q{i + 1}.</span>{" "}
                  {q}
                </div>
              ))}
            </div>
          )}

          {/* Current Streaming Question */}
          {displayedQuestion && (
            <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <p className="text-lg font-medium text-gray-800 leading-relaxed">
                {displayedQuestion}
                {!displayedQuestion.endsWith("?") && !isSpeaking && (
                  <span className="inline-block w-2 h-5 bg-purple-600 ml-1 animate-pulse" />
                )}
              </p>
            </div>
          )}

          {!displayedQuestion && questions.length === 0 && (
            <p className="text-gray-500 text-center mt-20">
              Waiting for AI to begin interview...
            </p>
          )}
        </div>

        {/* Status */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isSpeaking
              ? "AI is speaking... Please wait"
              : "You can speak now"}
          </p>
        </div>
      </div>

      {/* Title Card */}
      <div className="rounded-lg bg-white shadow-[0px_0px9px0pxrgba(0,0,0,0.14)] p-5">
        <h2 className="bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] bg-clip-text text-transparent font-bold text-2xl">
          {interviewTitle}
        </h2>
      </div>

      {/* Stop Button */}
      {isRecording && (
        <div className="mt-6 text-center">
          <Button
            onClick={onStopInterview}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium"
          >
            Stop Interview
          </Button>
        </div>
      )}
    </div>
  );
}