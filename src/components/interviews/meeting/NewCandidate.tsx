"use client";
import { errPopper } from "@/helpers/popper/errPopper";
import {
  checkForInterviewValidations,
  replaceAndRedirect,
} from "@/lib/helpers/checkForInterviewValidations";
import { removeSpacesFromObject } from "@/lib/helpers/removeSpacesFromObj";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/components/core/Loading";
import CandidateForm from "./CandidateForm";
import CandidateOTPForm from "./CandidateOTPForm";
import { useInterviewContext } from "@/context/InterviewContext";
import { set } from "date-fns";
import {
  getInterviewDetailsByIdForCandidateAPI,
  getWorkflowInterviewDetailsByIdForCandidateAPI,
} from "@/https/services/interviews";
import {
  getCandidateByEmailAPI,
  onCreateCandidateAPI,
  onVerifyCandidateOTPAPI,
  resendOTPAPI,
} from "@/https/services/candidate";

const NewCandidate = () => {
  const { workflow_id, interview_id } = useParams();
  const { setCopiedWorkflowId } = useInterviewContext();
  const { setCopiedInterviewDetails } = useInterviewContext();
  const [interviewData, setInterviewData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [candidateDetails, setCandidateDetails] = useState<any>({});
  const [errors, setErrors] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [canGetInterviewDetails, setCanGetInterviewDetails] = useState(true);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [candidateId, setCandidateId] = useState("");
  const [resendOTPLoading, setResendOTPLoading] = useState(false);
  const [otpSuccessMessageOrNot, setOtpSuccessMessageOrNot] = useState(false);

  useEffect(() => {
    if (workflow_id) {
      setCopiedWorkflowId(workflow_id as string);
    }
  }, [workflow_id, setCopiedWorkflowId]);

  const getInterviewDetailsById = async () => {
    try {
      setLoading(true);
      const response = workflow_id
        ? await getWorkflowInterviewDetailsByIdForCandidateAPI({
            workflowId: workflow_id as string,
            interviewId: interview_id as string,
            is_public: true,
          })
        : await getInterviewDetailsByIdForCandidateAPI({
            interviewId: interview_id as string,
            is_public: true,
          });
      if (response?.status == 200 || response?.status == 201) {
        const { data } = response?.data;
        setInterviewData(data);
      } else if (response.status == 400 || response.status == 404) {
        setCanGetInterviewDetails(false);
        const error = response?.data?.message || "Bad Request";
        setErrorMessage(error);
      } else {
        setCanGetInterviewDetails(false);
        throw response;
      }
    } catch (error) {
      errPopper(error);
    } finally {
      setLoading(false);
    }
  };
  const onSubmit = async () => {
    try {
      setSubmitLoading(true);
      setErrors([]);
      const body = removeSpacesFromObject(candidateDetails) || {};
      const response = await onCreateCandidateAPI({
        workflowId: workflow_id as string,
        body,
      });
      if (response.status == 200 || response.status == 201) {
        setOtpSuccessMessageOrNot(true);
        setSeconds(30);
        readyForOTPPreparation(response?.data);
      } else if (response?.status == 409) {
        setLoadingText(
          "User already registered for this interview with this email. Verifying..."
        );
        await getCandidateByEmail();
      } else if (response.status == 422) {
        setErrors(response?.data?.errors);
      } else {
        throw response;
      }
    } catch (error) {
      errPopper(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getCandidateByEmail = async () => {
    try {
      const response = await getCandidateByEmailAPI({
        workflowId: workflow_id as string,
        interviewId: interview_id as string,
        email: candidateDetails?.email,
      });
      if (response?.status == 200 || response?.status == 201) {
        const { data } = response?.data;
        const { candidate_verified } = data;
        if (candidate_verified) {
          checkForInterviewValidations(data, setLoadingText);
        } else {
          setLoadingText("Sending OTP...");
          await resendOTP(data);
        }
      } else {
        throw response;
      }
    } catch (err) {
      errPopper(err);
    }
  };

  const resendOTP = async ({ id: candidateId }: { id: string }) => {
    try {
      const response = await resendOTPAPI({
        interviewId: interview_id as string,
        candidateId,
      });
      if (response.status == 200 || response.status == 201) {
        setCandidateId(candidateId);
        setOtpSuccessMessageOrNot(true);
        setSeconds(30);
      } else {
        throw response;
      }
    } catch (err) {
      errPopper(err);
    } finally {
      setLoadingText("");
    }
  };

  const readyForOTPPreparation = async (details: any) => {
    const [data] = details?.data;
    const { id } = data;
    setCandidateId(id);
  };

  const onOTPVerify = async () => {
    if (otpLoading) return;
    setOtpLoading(true);
    setErrors([]);
    try {
      const response = await onVerifyCandidateOTPAPI({
        otp,
        workflowId: workflow_id as string,
        candidateId: candidateId,
      });

      if (response.status == 200 || response.status == 201) {
        setIsVerified(true);
        takeCandidateToInterview(response?.data);
      } else if (response.status == 422) {
        setErrors(response?.data?.errors);
      } else {
        setOtp("");
        throw response;
      }
    } catch (err) {
      errPopper(err);
    } finally {
      setOtpLoading(false);
    }
  };

  const takeCandidateToInterview = async (details: any) => {
    const [data] = details?.data;
    const { interview_code } = data;
    replaceAndRedirect(
      `/join-interview/${interview_id}/candidate/${interview_code}`
    );
    return;
  };

  const onResendOTP = async () => {
    if (otpLoading) return;
    if (resendOTPLoading) return;
    setOtp("");
    setErrors([]);
    setOtpSuccessMessageOrNot(false);
    setResendOTPLoading(true);
    await resendOTP({ id: candidateId });
    setResendOTPLoading(false);
  };
  useEffect(() => {
    getInterviewDetailsById();
  }, []);

  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds > 0) {
      const interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [seconds]);

  if (!canGetInterviewDetails) {
    return (
      <div className="min-h-[100vh] bg-[url('/chatbotquestionsscreen@3x.png')] bg-cover bg-no-repeat bg-fixed flex flex-col justify-center items-center relative">
        <Image
          src="/interviews/no-entry.svg"
          alt="User Not Found"
          width={400}
          height={400}
        />
        <p className="text-xl 3xl:!text-2xl font-medium text-black text-center">
          Oops! Sorry
        </p>
        <p className="text-lg 3xl:!text-xl font-normal text-black text-center">
          {errorMessage.split(".")[0]} <br />
        </p>
        <p className="text-lg 3xl:!text-xl font-normal text-black text-center">
          {errorMessage.split(".")[1]} <br />
        </p>
        <div className="absolute bottom-0 left-0 max-[767px]:hidden">
          <Image
            src="/interviews/positionImg.svg"
            alt=""
            width={400}
            height={300}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[url('/interview@3x.png')] bg-cover bg-no-repeat bg-fixed min-h-[100vh] relative max-[767px]:bg-[url('/interview@3x.png')] max-[767px]:bg-cover max-[767px]:bg-no-repeat max-[767px]:bg-fixed max-[767px]:z-10">
      {candidateId ? (
        <CandidateOTPForm
          interviewData={interviewData}
          onOTPVerify={onOTPVerify}
          otpLoading={otpLoading}
          setOtp={setOtp}
          otp={otp}
          isVerified={isVerified}
          errors={errors}
          onResendOTP={onResendOTP}
          resendOTPLoading={resendOTPLoading}
          otpSuccessMessageOrNot={otpSuccessMessageOrNot}
          seconds={seconds}
        />
      ) : (
        <CandidateForm
          loading={loading}
          interviewData={interviewData}
          candidateDetails={candidateDetails}
          errors={errors}
          submitLoading={submitLoading}
          onSubmit={onSubmit}
          setCandidateDetails={setCandidateDetails}
          setInterviewData={setInterviewData}
        />
      )}
      <div className="absolute bottom-0 left-0 max-[767px]:hidden">
        <Image
          src="/interviews/positionImg.svg"
          alt=""
          width={350}
          height={250}
        />
      </div>
      <Loading loading={loading} label="Getting Details..." />
      <Loading loading={!!loadingText} label={loadingText} />
    </div>
  );
};

export default NewCandidate;
