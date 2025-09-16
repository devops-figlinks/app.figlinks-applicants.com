export const pushToViewCandidate = (candidate: any, workFlowInterviewsIds: any, workflow_id: string, interviewId: string, router: any) => {
    sessionStorage.removeItem('allInterviewIds');
    const interview_qb_type = candidate?.interview_type || candidate?.interviews?.[0]?.type;
    const candidateId = candidate?.id;
    if (!candidate?.is_single_interview && workFlowInterviewsIds.length > 0) {
        sessionStorage.setItem('allInterviewIds', JSON.stringify(workFlowInterviewsIds));
    }
    const route =
        interview_qb_type === "MCQ"
            ? `/workflows/${workflow_id}/interviews/${interviewId}/candidates/${candidateId}/mcq-score`
            : `/workflows/${workflow_id}/interviews/${interviewId}/candidates/${candidateId}/summary`;
    router.push(route);
};