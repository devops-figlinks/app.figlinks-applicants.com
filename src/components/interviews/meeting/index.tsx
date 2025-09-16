"use client";

import MeetingView from "./desktop/MeetingView";
import { bulkUpsertItems, deleteAllItems } from "@/helpers/indexedDBQuestions";
import { errPopper } from "@/helpers/popper/errPopper";
import { checkForInterviewValidations } from "@/lib/helpers/checkForInterviewValidations";
import { decodeToVideoSDKToken } from "@/lib/helpers/decodeToVideoSDKToken";
import { IWebHookData } from "@/lib/interfaces/candidates";
import { IQuesObj } from "@/lib/interfaces/meeting";
import { getVideoSDKTokenAPI } from "@/https/services/videoSDK";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Loading from "@/components/core/Loading";
import MobileMeetingView from "./mobile/MobileMeetinView";
import { createOrUpdateItemIntroConclude } from "@/helpers/indexedDBIntroConclude";
import { useInterviewContext } from "@/context/InterviewContext";
import { getTheNameFromDataObj } from "@/helpers/getTheNameFromDataObj";
import {
  createMeetingWithTokenAPI,
  getInterviewByIdAndCandidateCodeAPI,
} from "@/https/services/candidate";

function getMediaDuration(url: string) {
  return new Promise<number>((resolve, reject) => {
    const media = new Audio();
    media.src = url;
    media.addEventListener("loadedmetadata", () => {
      resolve(media.duration);
    });
    media.addEventListener("error", (e: any) => {
      reject(`Error loading media: ${e?.message || "unknown"}`);
    });
  });
}

const getDuration = async (audioString: string | undefined) => {
  if (!audioString) return undefined;
  try {
    return await getMediaDuration(audioString);
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

type NormalizedQ = IQuesObj & { __uiKey: string; id?: string | number };

function normalizeQuestions(qs: IQuesObj[]): NormalizedQ[] {
  return (qs || []).map((q, i) => {
    const hasId = (q as any)?.id != null;
    const uiKey = hasId ? String((q as any).id) : `mcq-${i + 1}`;
    return { ...(q as any), __uiKey: uiKey };
  });
}

export function safeJoinInterviewPath(
  interviewId: string | number,
  candidateCode: string,
  segment?: string | number | null
): string {
  const base = `/join-interview/${interviewId}/candidate/${encodeURIComponent(
    candidateCode
  )}`;
  if (segment == null || segment === "") return base;
  return `${base}/${encodeURIComponent(String(segment))}`;
}

const getBlobsWithQuestions = (qtnAns: any[]) => {
  if (!Array.isArray(qtnAns)) return Promise.resolve([]);
  return Promise.allSettled(
    qtnAns.map(async (qtn: any) => {
      const url =
        qtn?.qtn_audio_url && typeof qtn.qtn_audio_url === "string"
          ? qtn.qtn_audio_url.trim()
          : "";

      if (url) {
        try {
          const [response, duration] = await Promise.all([
            fetch(url),
            getDuration(url),
          ]);
          const blob = await response.blob();
          return { ...qtn, audio: blob, duration };
        } catch {
          return { ...qtn, audio: undefined, duration: undefined };
        }
      }

      return { ...qtn, audio: undefined, duration: undefined };
    })
  ).then((settled) =>
    settled
      .filter((r) => r.status === "fulfilled" && (r as any).value)
      .map((r: any) => r.value as IQuesObj)
  );
};

const Meeting = () => {
  const { setInterviewType } = useInterviewContext();
  const pathname = usePathname();
  const params = useParams();
  const interview_id = params?.interview_id as string | undefined;
  const candidate_code = params?.candidate_code as string | undefined;

  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState<string>("");
  const [micOnOrNot, setMicOnOrNot] = useState(false);
  const [camOnOrNot, setCamOnOrNot] = useState(false);
  const [interviewData, setInterviewData] = useState<any>({});
  const [questions, setQuestions] = useState<IQuesObj[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [videoSDKToken, setVideoSDKToken] = useState("");
  const [loadingLabel, setLoadingLabel] = useState(
    "Getting Interview Details..."
  );
  const [userNotFound, setUserNotFound] = useState(false);
  const [webHookObj, setWebHookObj] = useState<IWebHookData>({
    endPoint: "",
    events: [],
  });

  const onMeetingLeave = () => {
    setMeetingId(null);
  };

  const getCandidateName = (data: any) => {
    return getTheNameFromDataObj(data);
  };

  const checkForThePermissions = (interview: any) => {
    return checkForInterviewValidations(interview, setLoadingLabel, true);
  };

  const setTheDetailsInIndexedDB = async ({
    qtn_ans,
    intro_blob,
    conclude_blob,
  }: {
    qtn_ans: IQuesObj[];
    intro_blob: Blob | null;
    conclude_blob: Blob | null;
  }) => {
    try {
      await deleteAllItems("questions");

      const upsertPayload = (qtn_ans || []).map((qtn: any, index: number) => {
        const hasId = qtn?.id != null;
        const id = hasId
          ? qtn.id
          : ((qtn?.qtn_code as string) ??
            `mcq-${index + 1}-${qtn?.slug ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}-${index}`)}`);
        return { ...qtn, id, order: index + 1 };
      });

      if (upsertPayload.length) {
        await bulkUpsertItems(upsertPayload, "questions");
      }

      const introSafe = intro_blob ?? new Blob([], { type: "audio/mpeg" });
      const concludeSafe =
        conclude_blob ?? new Blob([], { type: "audio/mpeg" });

      await createOrUpdateItemIntroConclude({
        id: 1,
        data: { intro_blob: introSafe, conclude_blob: concludeSafe },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getInterviewByIdAndCandidateCode = async () => {
    if (!interview_id || !candidate_code) {
      setUserNotFound(true);
      setLoadingLabel("");
      setErrorMessage("Missing interview_id or candidate_code in route.");
      return;
    }

    try {
      setLoadingLabel("Getting Interview Details...");

      const response = await getInterviewByIdAndCandidateCodeAPI({
        interviewId: interview_id,
        candidateCode: candidate_code,
      });

      if (response?.status == 200 || response?.status == 201) {
        const interview_qb_type =
          response?.data?.data?.interview?.interview_qb_type;
        setInterviewType(interview_qb_type);

        const { interview } = response?.data?.data || {};
        if (!interview) {
          throw new Error("No interview data");
        }

        if (!checkForThePermissions(response?.data?.data)) {
          return;
        }

        const qtnAns = await getBlobsWithQuestions(interview.qtn_ans || []);

        let intro: Blob | null = null;
        let conclude: Blob | null = null;

        const introUrl =
          typeof interview.intro_dailog_audio_url === "string"
            ? interview.intro_dailog_audio_url.trim()
            : "";
        const concludeUrl =
          typeof interview.conclude_dailog_audio_url === "string"
            ? interview.conclude_dailog_audio_url.trim()
            : "";

        if (introUrl) {
          try {
            const introBlobRes = await fetch(introUrl);
            intro = await introBlobRes.blob();
          } catch {
            intro = null;
          }
        }

        if (concludeUrl) {
          try {
            const concludeBlobRes = await fetch(concludeUrl);
            conclude = await concludeBlobRes.blob();
          } catch {
            conclude = null;
          }
        }

        const normalized = normalizeQuestions(qtnAns);

        setInterviewData({
          ...interview,
          qtn_ans: normalized,
          intro_blob: intro,
          conclude_blob: conclude,
        });
        setQuestions(normalized);

        await setTheDetailsInIndexedDB({
          qtn_ans: normalized,
          intro_blob: intro,
          conclude_blob: conclude,
        });

        setParticipantName(getCandidateName(response?.data?.data));

        const candidateId = response?.data?.data?.id;
        if (typeof candidateId !== "number") {
          throw new Error("Invalid candidate id");
        }

        await getVideoSDKToken(candidateId);
      } else if (response?.status == 400) {
        setUserNotFound(true);
        const error = response?.data?.message || "Bad Request";
        setErrorMessage(error);
      } else {
        throw response;
      }
    } catch (err: any) {
      setUserNotFound(true);
      setLoadingLabel("");
      console.error("Interview load failed:", err);
    }
  };

  const getVideoSDKToken = async (candidateId: number) => {
    try {
      setLoadingLabel("Preparing Interview...");
      const response = await getVideoSDKTokenAPI();
      if (response?.status == 200 || response?.status == 201) {
        const { accessToken } = response?.data?.data;
        setVideoSDKToken(accessToken);
        await createMeetingWithToken(accessToken, candidateId);
      } else {
        throw response;
      }
    } catch (err) {
      errPopper(err);
    } finally {
      setLoadingLabel("");
    }
  };

  const createMeetingWithToken = async (
    accessToken: string,
    candidateId: number
  ) => {
    try {
      const interviewNumeric = Number(interview_id);
      if (!Number.isFinite(interviewNumeric)) {
        throw new Error("Invalid interview_id");
      }

      const body = {
        candidate_id: candidateId,
        interview_id: interviewNumeric,
      };
      const response = await createMeetingWithTokenAPI({ accessToken, body });
      if (response?.status == 200 || response?.status == 201) {
        const { roomId, webhook } = response?.data || {};
        if (roomId) setMeetingId(roomId);
        if (webhook) setWebHookObj(webhook);
      } else {
        throw response;
      }
    } catch (err) {
      errPopper(err);
    }
  };

  useEffect(() => {
    void getInterviewByIdAndCandidateCode();
  }, []);

  if (userNotFound) {
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
          {errorMessage.split(".")} <br />
        </p>
        <p className="text-lg 3xl:!text-xl font-normal text-black text-center">
          {errorMessage.split(".") || ""} <br />
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

  const ready = Boolean(videoSDKToken && meetingId);

  return (
    <>
      {ready ? (
        <MeetingProvider
          config={{
            meetingId: meetingId!,
            name: participantName || "Candidate",
            micEnabled: micOnOrNot,
            webcamEnabled: camOnOrNot,
            maxResolution: "sd",
            debugMode: true,
            preferredProtocol: "UDP_ONLY",
          }}
          token={decodeToVideoSDKToken(videoSDKToken)}
        >
          {pathname.includes("/source-device-mobile") ? (
            <MobileMeetingView
              onMeetingLeave={onMeetingLeave}
              meetingId={meetingId!}
              participantName={participantName}
              setMicOnOrNot={setMicOnOrNot}
              setCamOnOrNot={setCamOnOrNot}
              interviewData={interviewData}
              questions={questions}
              setQuestions={setQuestions}
              videoSDKToken={videoSDKToken}
              setInterviewData={setInterviewData}
              webHookObj={webHookObj}
              micOnOrNot={micOnOrNot}
              camOnOrNot={camOnOrNot}
            />
          ) : (
            <MeetingView
              meetingId={meetingId!}
              onMeetingLeave={onMeetingLeave}
              participantName={participantName}
              setMicOnOrNot={setMicOnOrNot}
              setCamOnOrNot={setCamOnOrNot}
              interviewData={interviewData}
              questions={questions}
              setQuestions={setQuestions}
              videoSDKToken={videoSDKToken}
              setInterviewData={setInterviewData}
              webHookObj={webHookObj}
              micOnOrNot={micOnOrNot}
              camOnOrNot={camOnOrNot}
            />
          )}
        </MeetingProvider>
      ) : (
        <Loading label={loadingLabel} loading={!!loadingLabel} />
      )}
    </>
  );
};

export default Meeting;
