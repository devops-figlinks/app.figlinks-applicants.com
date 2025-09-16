import { Dispatch, SetStateAction } from "react";
import { getDataFuncTypes } from "./interviews";

export interface IQuestionAndAnswer {
  ans: string;
  c_ans: string;
  end_time: string;
  id: string;
  qtn: string;
  record_url: string;
  start_time: string;
  index: number;
  keyword_score: number;
  semantic_score: number;
  entailment_score: number;
  recordUrl: string;
  start_time_of_first_question: string;
  timeDifferences: titleAndStartTimeType[];
  difficulty: string | null | undefined;
}

export interface titleAndStartTimeType {
  title: string;
  start: number;
  thumbnail: string;
}
export interface SummaryGraphAreaProps {
  interviewType: string;
}
export interface ICandidateForm {
  loading: boolean;
  interviewData: any;
  candidateDetails: any;
  onSubmit: () => void;
  errors: any;
  submitLoading: boolean;
  setCandidateDetails: Dispatch<SetStateAction<any>>;
  setInterviewData: Dispatch<SetStateAction<any>>;
}

export interface ICandidateOTPForm {
  interviewData: any;
  onOTPVerify: () => void;
  otpLoading: boolean;
  setOtp: Dispatch<SetStateAction<string>>;
  otp: string;
  isVerified: boolean;
  errors: any[];
  onResendOTP: () => void;
  resendOTPLoading: boolean;
  otpSuccessMessageOrNot: boolean;
  seconds: number;
}

export interface IAPIResponseForCandidateScores {
  disc_scores: {
    dominance: number;
    influence: number;
    steadiness: number;
    conscientiousness: number;
    overall_score: number;
  };
  big_five_scores: {
    conscientiousness: number;
    agreebleness: number;
    extraversion: number;
    openness: number;
    neuroticism: number;
    overall_score: number;
    emotional_stability: number;
  };
  communication_scores: {
    professionalism: number;
    business_accumen: number;
    closing_technique: number;
    overall_score: number;
  };
  technical_scores: {
    keywords_score: number;
    entilement_score: number;
    semantic_score: number;
    overall_score: number;
  };
}

export interface CandidateListFiltersTypes {
  searchString: string;
  setSearchString: Dispatch<SetStateAction<string>>;
  dateValue: [Date, Date] | null;
  onChangeData: (fromDate: string, toDate: string) => void;
  onChangeStatus: (statusValue: string) => void;
  onChangeScores: (scoresValue: string) => void;
  onChangeAnswerd: (scoresValue: string) => void;
  status: string;
  graterthanscore: boolean;
  lessthanscore: boolean;
  lessthananswered: boolean;
  totalansweredbetweenfivetoten: boolean;
  interview: null | { id: number | string; title: string };
  setInterview: (value: { id: number | string; title: string } | null) => void;
  getAllCandidates: (params: Partial<getDataFuncTypes>) => void;
}

export interface IPrevAndNextCandidateId {
  previousCandidateData: {
    id: null | number;
    interview_id: null | number;
  };
  nextCandidateData: {
    id: null | number;
    interview_id: null | number;
  };
}

export interface IWebHookData {
  endPoint: string;
  events: string[];
}