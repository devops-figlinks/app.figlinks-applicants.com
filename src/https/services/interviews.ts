import { $fetch } from "../fetch";
export const getAllAutomationInterviewsAPI = async (params: any) => {
  try {
    return await $fetch.get("/interviews/drop-down", params);
  } catch (err) {
    throw err;
  }
};

export const getAllInterviewIdsAPI = async (params: any) => {
  try {
    return await $fetch.get("/interviews/all", params);
  } catch (err) {
    throw err;
  }
};

export const deleteWorkflowByIdAPI = async ({
  WorkflowId,
}: {
  WorkflowId: string;
}) => {
  try {
    return await $fetch.delete(`/workflows/${WorkflowId}`);
  } catch (err) {
    throw err;
  }
};

export const saveInterviewAPI = async ({
  payload,
  interviewId,
  candidateCode,
}: {
  payload: any;
  interviewId: string;
  candidateCode: string;
}) => {
  try {
    // `/interviews/${interviewId}/candidates/${candidateCode}/submit`,
    return await $fetch.post(
      `/interviews/${interviewId}/candidates/${candidateCode}/submit`,
      payload
    );
  } catch (err) {
    throw err;
  }
};

export const submitReviewAPI = async ({
  interviewId,
  candidateCode,
  body,
}: {
  interviewId: string;
  candidateCode: string;
  body: { c_review: string; c_rating: number | null };
}) => {
  try {
    return await $fetch.post(
      `/interviews/${interviewId}/candidates/${candidateCode}/review`,
      body
    );
  } catch (err) {
    throw err;
  }
};

export const getAllDashboardStatsAPI = async () => {
  try {
    return await $fetch.get("/interviews/stats");
  } catch (err) {
    throw err;
  }
};

export const getAllAdminDashboardStatsAPI = async () => {
  try {
    return await $fetch.get("/users/stats");
  } catch (err) {
    throw err;
  }
};

export const getInterviewByIdAPI = async (interviewId: string) => {
  try {
    return await $fetch.get(`/interviews/${interviewId}`,);
  } catch (err) {
    throw err;
  }
};
export const getWorkFlowByIdAPI = async (workflowId: string) => {
  try {
    return await $fetch.get(`/workflows/${workflowId}`);
  } catch (err) {
    throw err;
  }
};
export const updateWorkFlowByIdAPI = async (workflowId: string, payload: any) => {
  try {
    return await $fetch.patch(`/workflows/${workflowId}`, payload);
  } catch (err) {
    throw err;
  }
};
export const getAllParticipantsAPI = async ({
  workFlowId,
  queryParams,
}: {
  workFlowId: any;
  queryParams: any;
}) => {
  try {
    return await $fetch.get(
      `/workflows/${workFlowId}/candidates`,
      queryParams
    );
  } catch (err: any) {
    throw err;
  }
};

export const getAllCandidatesAPI = async ({
  interviewId,
  queryParams,
}: {
  interviewId: string;
  queryParams: Partial<any>;
}) => {
  try {
    return await $fetch.get(
      `/workflows/${interviewId}/candidates`,
      queryParams
    );
  } catch (err: any) {
    throw err;
  }
};

export const exportAllCandidatesAPI = async ({
  workflowId,

}: {
  workflowId: string;
}) => {
  try {
    return await $fetch.get(
      `/workflows/${workflowId}/candidates-export`,

    );
  } catch (err: any) {
    throw err;
  }
};

export type AttendanceData = {
  day: string;
  date: string;
  attended: number;
};

export type AttendanceResponse = {
  attendance: AttendanceData[];
};

export const getAttendanceAPI = async (): Promise<AttendanceResponse> => {
  try {
    const response = await fetch("/interviews/viewinterview", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AttendanceResponse = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching attendance data:", err);
    throw err;
  }
};

export const generateQuestionsAPI = async ({
  payload,
}: {
  payload: { prompt_topic: string, interview_qb_type?: string };
}) => {
  try {
    return await $fetch.post("/interviews/generate-content", payload);
  } catch (err) {
    throw err;
  }
};

export const getInterviewDetailsByIdForCandidateAPI = ({
  interviewId,
  is_public,
}: {
  interviewId: string;
  is_public: boolean;
}) => {
  try {
    return $fetch.get(`/interviews/${interviewId}?is_public=${is_public}`);
  } catch (err) {
    throw err;
  }
};

export const getWorkflowInterviewDetailsByIdForCandidateAPI = ({
  workflowId,
  interviewId,
  is_public,
}: {
  workflowId: string
  interviewId: string;
  is_public: boolean;
}) => {
  try {
    return $fetch.get(`/workflows/${workflowId}/interviews/${interviewId}?is_public=${is_public}`);
  } catch (err) {
    throw err;
  }
};
export const getCandidatesCountByInterviewIdAPI = ({
  interviewId,
}: {
  interviewId: string;
}) => {
  try {
    return $fetch.get(`/interviews/${interviewId}/candidates/count`);
  } catch (err) {
    throw err;
  }
};


export const getStatsByInterviewIdAPI = async (workflowId: string) => {
  try {
    return $fetch.get(`/workflows/${workflowId}/stats`);
  } catch (err) {
    throw err;
  }
};

export const getGenerateAnswers = async ({
  payload,
}: {
  payload: { question: string };
}) => {
  try {
    return await $fetch.post("/interviews/generate-answer", payload);
  } catch (err) {
    throw err;
  }
};




export const interviewUserImagesAPI = async ({
  payload,
  interviewId,
  candidateCode,
}: {
  payload: any;
  interviewId: string;
  candidateCode: string;
}) => {
  try {
    return await $fetch.post(
      `/interviews/${interviewId}/${candidateCode}/screenshots`,
      payload
    );
  } catch (err) {
    throw err;
  }
};