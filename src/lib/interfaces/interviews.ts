import React, { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";

export interface Message {
  question?: ReactNode;
  id: string;
  prompt: string;
  questionsAndAnswers: {
    options?: any;
    question?: string;
    answer?: string | boolean;
  }[];
}

export interface IDifficultySelectorBlock {
  handleAddDifficulty: (e: any, index: number) => void,
  index: number,
  msg: any
}

export interface SelectedMessage {
  id: string;
  qtn: string;
  ans: string;
  time_limit?: string;
  options?: any[];
  difficulty?: "EASY" | "MEDIUM" | "HARD" | null;
}
export interface IPhase1ChatBot {
  selectedMessages: SelectedMessage[];
  handleRemove?: (messageId: string, index: number) => void;
  setPhase?: (phase: string) => void;
  todayTime: string;
  messages: Message[];
  handleUnselectAll?: () => void;
  handleSelectAll?: () => void;
  getInterviewQuestions: (prompt?: string) => void;
  input: string;
  handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUnselect: (messageId: string, index: number) => void;
  handleSelect: (messageId: string, index: number) => void;
  setSelectedMessages: React.Dispatch<React.SetStateAction<SelectedMessage[]>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  inteviewQuestionsType?: string;
  setInterviewQuestionsType?: React.Dispatch<React.SetStateAction<string>>;
  setMcqPhase?: React.Dispatch<React.SetStateAction<string>>;
}
export interface IQuesTime {
  qtn: string;
  start_time: string;
  end_time: string;
  id: string;
  difficulty?: string | null | undefined;
isParticipant?: boolean
}

export interface IInterviewFilters {
  searchString: string;
  setSearchString: Dispatch<SetStateAction<string>>;
  dateValue: { fromDate: string; toDate: string } | undefined;
  onChangeData: (fromDate: string, toDate: string) => void;
  onChangeStatus: (statusValue: string) => void;
  status: string;
}

export interface getDataFuncTypes {
  page: string | number;
  limit: string | number;
  sort_by: string;
  sort_type: string;
  searchString: string;
  from_date: string;
  to_date: string;
  status: string;
  interview_id?: string;
  interview_date_from?: string;
  interview_date_to?: string;
  interview_title?: string;
  is_public: string | boolean;
  is_score_above_forty?: string;
  is_score_below_forty?: string;
  total_ans_lt_five?: string;
  total_ans_between_five_to_ten?: string;
  exportValue: string | boolean;
  from_created_at: string;
  to_created_at: string;
}

export interface ICandidateFilters {
  searchString: string;
  setSearchString: Dispatch<SetStateAction<string>>;
  exportAllCandidates: () => Promise<void>;
  onChangeScores: (e: string) => void;
  onChangeAnswered: (e: string) => void;
  graterthanscore: boolean;
  lessthanscore: boolean;
  lessthananswered: boolean;
  totalansweredbetweenfivetoten: boolean;
  isSelecting: boolean;
  setIsSelecting: Dispatch<SetStateAction<boolean>>;
  selectAllChecked: boolean;
  setSelectAllChecked: Dispatch<SetStateAction<boolean>>;
  allSelected: boolean;
  selectedRows: any[];
  handleSendClick: () => void;
  handleSendMessageClick: () => void;
  onChangeStatus: (statusValue: string) => void;
  status: string;
  handleManualMoveSelect?: () => void;
}
export interface SelectedMessages {
  id: string;
  qtn: string;
  ans: string;
  time_limit?: string;
  que_audio: string;
}
export type ChatbotQuestionsScreenType = {
  className?: string;
  selectedMessages?: SelectedMessage[];
};

export interface Option {
  id: string;
  text: string;
  editing?: boolean;
}
export interface MCQImportRow {
  Questions: string;
  Answer: string;
  difficulty?: string | null;
  [key: string]: string | null | undefined;
}

export interface IInterviewDetailsBlock {
  handleTextFieldChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  data: any;
  errMessages: Array<{
    key: string;
    message: string;
  }>;
  setMcqPhase?: React.Dispatch<React.SetStateAction<string>>;
  currentTime: Date;
  handleDateChange: (dates: Date | null, name: string) => void;
  handleUpdateCurrentTime: () => void;
  onCancelConfirmation: () => void;
  handleSubmit: () => void;
  id?: string | string[];
  handleDeleteChip: (chipToDelete: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  tag: string;
  handleChangeQuestion: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setData: React.Dispatch<React.SetStateAction<any>>;
  durationError: string;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleReminderChange: (event: any) => void;
  restrictToNumbers: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export interface IQuestionsDetailsBlock {
  ques: any[];
  editIndex: number | null;
  editData: {
    qtn: string;
    ans: string;
    options: string[];
    optionErrors: string[];
  };
  handleTextFieldChanged: (field: string, value: string) => void;
  manualQueError: {
    que: string;
    ans: string;
    options?: string[];
  };
  setEditData: React.Dispatch<
    React.SetStateAction<{
      qtn: string;
      ans: string;
      options: string[];
      optionErrors: string[];
    }>
  >;
  handleSave: () => void;
  handleCancel: () => void;
  handleDoubleClick: (index: number) => void;
  setQues: React.Dispatch<React.SetStateAction<any[]>>;
  handleMcqRemove: (index: number) => void;
  handleAddDifficulty: (e: any, index: number) => void;

  addque: boolean;
  manualque: string;
  handleManualque: () => void;
  handleQuestionchange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  manualans: string;
  setManualans: React.Dispatch<React.SetStateAction<string>>;
  manauloptions: Option[];
  handleOptionTextChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => void;
  handleAddOption: () => void;
  handleSaveMcqQuestion: () => void;
  handleRemoveOption: (index: number) => void;
  handleCancelCustomQuestions: () => void;
  handleAddCustomQuestions: () => void;
  errMessages: any[];
  setSelectedMessages?: React.Dispatch<React.SetStateAction<SelectedMessage[]>>;
}
