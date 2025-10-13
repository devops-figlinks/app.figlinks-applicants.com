import Image from "next/image";
import { FC } from "react";
import Loading from "@/components/core/Loading";
import useQuestionsHook from "@/lib/hooks/meeting/useQuestionsHooks";
import {
  IQuestioningBlock,
  IUseQuestionHookReturnType,
} from "@/lib/interfaces/meeting";
import { TypeAnimation } from "react-type-animation";
import RedirectingDialog from "./RedirectingDialog";
import { Button } from "@/components/ui/button";
import { timerColor } from "@/lib/helpers/timerColors";

const QuestioningBlock: FC<IQuestioningBlock> = (props) => {
  const {
    questionNo,
    isInterviewComplete,
    questions,
    interviewData,
    isInterviewStarted,
    startTheNextQuestion,
    counts,
    setCounts,
    capturedImages,
    setCapturedImages,
    isRecording,
  } = props;
  const {
    renderTypeWriter,
    isRedirecting,
    showNextButtonOrNot,
    submittingInterview,
    submitInterviewForTesting,
    submitError,
    detectionCounts,
    remainingTime,
    timer1,
  }: IUseQuestionHookReturnType = useQuestionsHook(props);
  const getMinAndSecsFromSecs = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };
  return (
    <div className="self-stretch flex flex-col grow-1">
      <div className="box-border rounded-lg bg-white shadow-[0px_0px_9px_0px_rgba(0,_0,_0,_0.14)] p-4 mb-3 grow-1">
        <header className="border-b border-[#dadada] pb-2">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Image alt="" src="/interviews/sparkleimage.svg" height={15} width={15} />
              <p className="text-base">Questions</p>
            </div>
            {remainingTime > 0 && isRecording && timer1 && (
              <div
                className={`flex items-center gap-1 text-[13px] 3xl:!text-base font-medium leading-[100%] capitalize m-0 ${remainingTime < 10 ? "text-[#ff6347]" : "text-black"
                  }`}
              >
                <Image
                  src="/interviews/timer-icon2.svg"
                  alt="timepicker"
                  width="16"
                  height={16}
                />
                <span style={{ fontSize: "13px", color: timerColor(remainingTime) }}>{getMinAndSecsFromSecs(remainingTime)} secs</span>
              </div>
            )}
          </div>
        </header>
        <div className="flex flex-col gap-2 h-[95%]">
          <div className="h-[40vh] overflow-auto flex-1">
            <p className="text-black text-base font-normal leading-[150%] m-2">
              {renderTypeWriter ? (
                <TypeAnimation
                  style={{
                    whiteSpace: "pre-line",
                    height: "195px",
                    display: "block",
                  }}
                  sequence={
                    isInterviewComplete
                      ? [interviewData.conclude_dailog?.replaceAll("...", "")]
                      : !isInterviewStarted
                        ? [interviewData.intro_dailog?.replaceAll("...", "")]
                        : [`${questionNo + 1}. ${questions[questionNo]?.qtn}`]
                  }
                  speed={50}
                  repeat={1}
                />
              ) : (
                ""
              )}
            </p>
          </div>

          <div className="flex items-center justify-end gap-4">
            {questions.length && !isInterviewComplete ? (
              <Button
                className={`w-18 h-7 p-1 rounded-sm border-none leading-none capitalize text-sm 3xl:!text-base font-medium md:px-2.5 md:text-[14px] shadow-none ${showNextButtonOrNot
                    ? "active text-[#a533cf] bg-[rgba(165,51,207,.2)] cursor-pointer"
                    : "inactive bg-gray-300 text-black/60"
                  }`}
                variant="default"
                onClick={startTheNextQuestion}
                disabled={!showNextButtonOrNot}
              >
                {"Next"}
              </Button>
            ) : (
              ""
            )}

            {submitError && navigator.onLine ? (
              <Button
                className="px-8 py-2 rounded-sm bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] shadow-[0_0_24px_0_rgba(153,23,255,0.1),0_0_1px_4px_rgba(255,255,255,0.1)] text-white leading-none capitalize font-primary text-sm 3xl:!text-base font-medium md:px-2.5 md:text-[14px] cursor-pointer"
                variant="default"
                onClick={submitInterviewForTesting}
              >
                {"Submit"}
              </Button>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
      <div className="flex items-start flex-col rounded-lg bg-white shadow-[0px_0px_9px_0px_rgba(0,_0,_0,_0.14)] p-4">
        <div className="bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] bg-clip-text text-transparent font-medium text-xl 3xl:!text-2xl leading-[120%] capitalize mb-4">
          {interviewData?.title}
        </div>
      </div>

      <RedirectingDialog openOrNot={isRedirecting} />
      <Loading
        loading={submittingInterview}
        label={"Submitting Interview, please wait...!\nDon't refresh the page"}
      />
    </div>
  );
};

export default QuestioningBlock;