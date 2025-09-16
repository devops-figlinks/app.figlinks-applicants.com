import { $fetch } from "../fetch";
import { BASEURL } from "@/helpers/getBaseURL";
export const createBulkParticipantsAPI = async ({
  interviewId,
  bulkParticipants,
}: {
  interviewId: string;
  bulkParticipants: any[];
}) => {
  try {
    return await $fetch.post(
      `/workflows/${interviewId}/bulk`
      , { "candidates": bulkParticipants });
  } catch (err) {
    throw err;
  }
};

export const getInterviewByIdAndCandidateCodeAPI = async ({
  interviewId,
  candidateCode,
}: {
  interviewId: string;
  candidateCode: string;
}) => {
  try {
    return await $fetch.get(
      `/interviews/${interviewId}/candidates/by-code/${candidateCode}`
    );
  } catch (err) {
    throw err;
  }
};

export const getInstructionsByIdAndCandidateCodeAPI = async ({
  interviewId,
  candidateCode,
}: {
  interviewId: string;
  candidateCode: string;
}) => {
  try {
    return await $fetch.get(
      `/interviews/${interviewId}/candidates/by-code/${candidateCode}/intro`
    );
  } catch (err) {
    throw err;
  }
};


// export const createMeetingWithTokenAPI = async ({
//   accessToken,
// }: {
//   accessToken: string;
// }) => {
//   try {
//     const url = BASEURL + "/meeting/rooms";
//     const options = {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `${accessToken}`,
//       },
//     };

//     const response = await fetch(url, options);
//     let responseData = await response.json();
//     return { ...responseData, status: response.status };
//   } catch (err) {
//     throw err;
//   }
// };
export const createMeetingWithTokenAPI = async ({
  accessToken,
  body,
}: {
  accessToken: string;
  body: {
    candidate_id: number;
    interview_id: number;
  };
}) => {
  try {
    const url = BASEURL + "/meeting/rooms";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${accessToken}`,
      },
      body: JSON.stringify(body),
    };

    const response = await fetch(url, options);
    let responseData = await response.json();
    return { ...responseData, status: response.status };
  } catch (err) {
    throw err;
  }
};


export const deleteCandidateByIdAPI = async ({
  workflowId,
  candidateId,
}: {
  workflowId: string;
  candidateId: string;
}) => {
  try {
    return await $fetch.delete(`/workflows/${workflowId}/candidates/${candidateId}`);
  } catch (err) {
    throw err;
  }
};



export const getWorkFlowStatsAPI = async (workflowId: string) => {
  try {
    return await $fetch.get(
      `/workflows/${workflowId}/candidates/attendance-graph`
    );
  } catch (err) {
    throw err;
  }
};


export const onCreateCandidateAPI = async ({
  workflowId,
  body,
}: {
  workflowId: string;
  body: any;
}) => {
  try {
    return await $fetch.post(
      `/workflows/${workflowId}/public-candidates`,
      body
    );
  } catch (err) {
    throw err;
  }
};

export const getCandidateByIdAPI = async ({
  interviewId,
  candidateId,
}: {
  interviewId: string;
  candidateId: string;
}) => {
  try {
    return await $fetch.get(
      `/interviews/${interviewId}/candidates/${candidateId}`
    );
  } catch (err) {
    throw err;
  }
};
export const sendEmailAPI = async ({
  workflowId,
  body,
}: {
  workflowId: string;
  body: any;
}) => {
  try {
    return await $fetch.post(
      `/workflows/${workflowId}/candidates/send-emails`,
      body
    );
  } catch (err) {
    throw err;
  }
};
export const sendEmailsAllAPI = async ({
  workflowId,
  interviewId,
}: {
  workflowId: string;
  interviewId: string;
}) => {
  try {
    return await $fetch.post(
      `/workflows/${workflowId}/interviews/${interviewId}/send-emails`,
    );
  } catch (err) {
    throw err;
  }
};
export const sendMessagesAllAPI = async ({
  workflowId,
  interviewId,
}: {
  workflowId: string
  interviewId: string;

}) => {
  try {
    return await $fetch.post(
      `/workflows/${workflowId}/interviews/${interviewId}/send-whatsapp`,
    );
  } catch (err) {
    throw err;
  }
};

export const sendMessagesAPI = async ({
  workflowId,
  body,
}: {
  workflowId: string;
  body: any;
}) => {
  try {
    return await $fetch.post(`/workflows/${workflowId}/candidates/send-whatsapp`,
      body
    );
  } catch (err) {
    throw err;
  }
};

export const sendMessageAPI = async ({
  workflowId,
  candidateId,
}: {
  workflowId: string;
  candidateId: string;
}) => {
  try {
    return await $fetch.post(
      `/workflows/${workflowId}/candidates/${candidateId}/send-whatsapp`
    );
  } catch (err) {
    throw err;
  }
};
export const updateCandidateStatusAPI = async ({
  workflowId,
  body,
}: {
  workflowId: string;
  body: any;
}) => {
  try {
    return await $fetch.post(
      `/workflows/${workflowId}/update-candidate-status`,
      body
    );
  } catch (err) {
    throw err;
  }
};

export const getCandidateByEmailAPI = async ({
  workflowId,
  interviewId,
  email,
}: {
  workflowId: string
  interviewId: string;
  email: string;
}) => {
  try {
    return await $fetch.get(
      `/workflows/${workflowId}/interviews/${interviewId}/by-email/${email}`
    );
  } catch (err) {
    throw err;
  }
};

export const onVerifyCandidateOTPAPI = async ({
  otp,
  workflowId,
  candidateId,
}: {
  otp: string;
  workflowId: string;
  candidateId: string;
}) => {
  try {
    return await $fetch.post(
      `/workflows/${workflowId}/public-candidates/${candidateId}/verify`,
      { otp }
    );
  } catch (err) {
    throw err;
  }
};

export const resendOTPAPI = async ({
  interviewId,
  candidateId,
}: {
  interviewId: string;
  candidateId: string;
}) => {
  try {
    return await $fetch.post(
      `/interviews/${interviewId}/candidates/${candidateId}/resend-otp`
    );
  } catch (err) {
    throw err;
  }
};

export const getCandidateTranscriptDetailsAPI = async ({
  interviewId,
  candidateId,
  workflowId,
}: {
  interviewId: string;
  candidateId: string;
  workflowId: string
}) => {
  try {
    return await $fetch.get(
      `/workflows/${workflowId}/interviews/${interviewId}/candidates/${candidateId}/transcript`
    );
  } catch (err) {
    throw err;
  }
};

export const getCandidateScoreByIdAPI = async ({
  interviewId,
  candidateId,
  workflowId,
}: {
  interviewId: string;
  candidateId: string;
  workflowId: string
}) => {
  try {
    return await $fetch.get(
      `/workflows/${workflowId}/interviews/${interviewId}/candidates/${candidateId}/score`
    );
  } catch (err) {
    throw err;
  }
};

export const getCandidateSummaryByIdAPI = async ({
  interviewId,
  candidateId,
  workflowId,
}: {
  interviewId: string;
  candidateId: string;
  workflowId: string
}) => {
  try {
    return await $fetch.get(
      `/workflows/${workflowId}/interviews/${interviewId}/candidates/${candidateId}/summary`
    );
  } catch (err) {
    throw err;
  }
};

export const getCandidateOverallScoreByIdAPI = async ({
  interviewId,
  candidateId,
}: {
  interviewId: string;
  candidateId: string;
}) => {
  try {
    return await $fetch.get(
      `/interviews/${interviewId}/candidates/${candidateId}/overall-graph`
    );
  } catch (err) {
    throw err;
  }
};

export const getAllCandidatesAPI = async ({
  queryParams,
}: {
  queryParams: any;
}) => {
  try {
    return await $fetch.get(`/all-candidates`, queryParams);
  } catch (err) {
    throw err;
  }
};

export const getNextAndPrevIdsAPI = async ({
  workflowId,
  candidateId,
  queryParams,
}: {
  workflowId: string;
  candidateId: string;
  queryParams: any;
}) => {
  try {
    return await $fetch.get(
      `/workflows/${workflowId}/candidates/${candidateId}/next-prev`,
      queryParams
    );
  } catch (err) {
    throw err;
  }
};

export const downloadCandidateReportAPI = async ({
  interviewId,
  candidateId,
}: {
  interviewId: string;
  candidateId: string;
}) => {
  try {
    return await $fetch.get(
      `/interviews/${interviewId}/candidates/${candidateId}/download-report`
    );
  } catch (err) {
    throw err;
  }
};
