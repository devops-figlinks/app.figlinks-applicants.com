import { IMcqQuestionsBlock } from "@/lib/interfaces/meeting";
import { usePathname } from "next/navigation";
import React from "react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const McqQuestionsComponent = (props: IMcqQuestionsBlock) => {
  const {
    currentStage,
    interviewData,
    questionNo,
    questionText,
    selectedAnswers,
    options,
    isOptionSelected,
    handleOptionSelect,
    questionId,
  } = props;

  const pathname = usePathname();
  const renderContent = () => {
    switch (currentStage) {
      case "intro":
        return (
          <div className="p-2">
            <p className="text-white md:text-black text-base font-medium leading-[140%] capitalize">
              {interviewData.intro_dailog}
            </p>
          </div>
        );
      case "conclusion":
        return (
          <div className="p-2">
            <p className="text-white md:text-black text-base font-medium leading-[140%] capitalize">
              {interviewData.conclude_dailog}
            </p>
          </div>
        );
      case "questions":
      default:
        return (
          <div className="p-2">
            {pathname?.includes("/source-device-mobile") ? (
              <h6 className="text-white md:text-black/60 text-sm 3xl:!text-lg font-normal capitalize mb-1.5">
                {questionNo + 1}. Question
              </h6>
            ) : (
              <p className="text-white md:text-black/60 text-sm 3xl:!text-lg font-normal capitalize mb-2">
                Question {questionNo + 1}
              </p>
            )}
            <p className="text-white md:text-black text-base 3xl:!text-lg font-medium leading-[140%] capitalize">
              {questionText}
            </p>
            <div className="mt-2 mb-4 flex flex-col gap-2">
              {options?.map((option, index) => (
                <Label
                  key={index}
                  className="flex items-start gap-3 p-2 transition-all duration-300 ease-in-out rounded-md hover:bg-black/5"
                >
                  <Input
                    type="radio"
                    name={`question-${questionId}`}
                    value={option}
                    checked={isOptionSelected(option)}
                    onChange={() => handleOptionSelect(option)}
                    className="w-4 h-4 text-white focus:ring-0 accent-green-600 cursor-pointer shadow-none mt-0.5 flex-shrink-0"
                  />
                  <span className="text-white md:text-black text-sm md:text-sm 3xl:!text-base font-medium capitalize">
                    {`${String.fromCharCode(65 + index)}. ${option}`}
                  </span>
                </Label>
              ))}
            </div>
          </div>
        );
    }
  };

  return renderContent();
};

export default McqQuestionsComponent;
