import { Dispatch, SetStateAction } from "react";

export const checkForInterviewValidations = (
  interview: any,
  setLoadingText: Dispatch<SetStateAction<string>>,
  redirectOrNot?: boolean
) => {
  const { interview_code, c_rating, completed, interview_id } = interview;
  if (!completed) {
    if (redirectOrNot) {
      return true;
    }
    setLoadingText(
      "User already registered for this interview with this email. Redirecting..."
    );
    replaceAndRedirect(
      `/join-interview/${interview_id}/candidate/${interview_code}`
    );
    return;
  }
  if (!c_rating) {
    setLoadingText(
      "Looks like you already attended the interview. Redirecting..."
    );
    replaceAndRedirect(
      `/join-interview/${interview_id}/candidate/${interview_code}/rating-review`
    );
    return;
  }
  setLoadingText(
    "Looks like you already attended the interview. Redirecting..."
  );
  replaceAndRedirect("/interview-final-thanking-page");
};

export const replaceAndRedirect = (url: string) => {
  setTimeout(() => {
    window.location.replace(url);
  }, 2000);
};
