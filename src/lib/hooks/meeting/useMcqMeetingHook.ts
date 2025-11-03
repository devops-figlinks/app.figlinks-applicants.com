import { IMcqExamBlock, IQuestioningBlock } from "@/lib/interfaces/meeting";
import { useEffect, useState } from "react";
import useQuestionsHook from "./useQuestionsHooks";

export const useMcqMeetingHook = (props: IMcqExamBlock & IQuestioningBlock) => {
  const {
    questions,
    questionNo,
    setQuestions,
    startTheNextQuestion,
    interviewTimes,
    setQuestionAnswers,
    setInterviewTimes,
    currentStage,
    setCurrentStage,
  } = props;

  const {
    submittingInterview,
    submitInterviewForTesting,
    remainingTime,
    timer1,
    setCountQuestion,
    playAudioFromQuestions,
    countdownRef,
    setTimer1,
  } = useQuestionsHook(props);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >(() => {
    const initialAnswers: Record<string, string> = {};
    questions.forEach((question) => {
      if (question.ans) {
        initialAnswers[question.id] = question.ans;
      }
    });
    return initialAnswers;
  });
  // const [currentStage, setCurrentStage] = useState<'intro' | 'questions' | 'conclusion'>('intro');
  const isOptionSelected = (optionText: string) => {
    return selectedAnswers[questionId] === optionText;
  };
  const handleOptionSelect = (optionText: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionText,
    }));
    const updatedQuestions = questions.map((q) =>
      q.id === questionId ? { ...q, ans: optionText } : q
    );
    setQuestions(updatedQuestions);
    setQuestionAnswers &&
      setQuestionAnswers((prev) => {
        return prev.map((qa) =>
          qa.qns === currentQuestion.qtn ? { ...qa, c_answer: optionText } : qa
        );
      });
  };
  const getMinAndSecsFromSecs = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };
  const currentQuestion = questions[questionNo] || {};
  const {
    qtn: questionText = "",
    options = [],
    id: questionId,
  } = currentQuestion;
  useEffect(() => {
    setTimer1(true);
    if (currentStage === "questions" && !countdownRef?.current) {
      playAudioFromQuestions();
    }
    return () => {
      if (countdownRef?.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [currentStage, questionNo]);

  const handleNext = () => {
    if (currentStage === "intro") {
      const now = new Date();
      setInterviewTimes &&
        setInterviewTimes((prev) => ({
          ...prev,
          firstQuestionTime: now,
        }));
      setCurrentStage("questions");
    } else if (currentStage === "questions") {
      const totalQuestions = questions.length;
      if (!selectedAnswers[questionId]) {
        setQuestionAnswers &&
          setQuestionAnswers((prev) => {
            return prev.map((qa) =>
              qa.qns === currentQuestion.qtn ? { ...qa, c_answer: "" } : qa
            );
          });
      }
      if (questionNo >= totalQuestions - 1 || totalQuestions === 0) {
        const now = new Date();
        setInterviewTimes &&
          setInterviewTimes((prev) => ({
            ...prev,
            lastQuestionTime: now,
          }));
        setCurrentStage("conclusion");
      } else {
        startTheNextQuestion();
      }
    }
  };
  const handleSubmit = () => {
    if (!interviewTimes.lastQuestionTime) {
      const now = new Date();
      setInterviewTimes((prev) => ({
        ...prev,
        lastQuestionTime: now,
      }));
    }
      if (submitInterviewForTesting) {
            submitInterviewForTesting();
        }
  };
  return {
    currentStage,
    selectedAnswers,
    currentQuestion,
    questionText,
    questionId,
    options,
    remainingTime,
    timer1,
    getMinAndSecsFromSecs,
    submittingInterview,
    isOptionSelected,
    handleOptionSelect,
    handleNext,
    handleSubmit,
  };
};

export default useMcqMeetingHook;
