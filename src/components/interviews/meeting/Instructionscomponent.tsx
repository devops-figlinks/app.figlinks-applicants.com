import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Loading from "@/components/core/Loading";
import { errPopper } from "@/helpers/popper/errPopper";
import { getInstructionsByIdAndCandidateCodeAPI } from "@/https/services/candidate";
import { checkForInterviewValidations } from "@/lib/helpers/checkForInterviewValidations";
import { RightIcon } from "@/components/icons/interviews/rightIcon";
import { WrongIcon } from "@/components/icons/interviews/wrongIcon";
import { HandIcon } from "@/components/icons/interviews/handImg";
import { FileIcon } from "@/components/icons/interviews/fileImg";

const guidelines_mcq = [
  {
    icon: <RightIcon />,
    title:
      "MCQ-Based Interview – This is a multiple-choice question (MCQ) interview. Read each question carefully and select the correct option(s).",
  },
  {
    icon: <RightIcon />,
    title:
      "Maintain Eye Contact – Keep your head still and look directly at the camera.",
  },
  {
    icon: <RightIcon />,
    title:
      "Check Your Setup – Ensure internet, camera, and webcam are working. Use a charged device with good lighting.",
  },
  {
    icon: <RightIcon />,
    title:
      "Navigation & Time Management – Wait for each question to load. Use the Next button to continue. Manage time—each question is timed.",
  },
  {
    icon: <RightIcon />,
    title:
      "Face Detection Alert – Your face must stay visible. Test ends automatically if face not detected 3 times.",
  },
];
const guidelines = [
  {
    icon: <RightIcon />,
    title:
      "Maintain eye contact & speak clearly – keep your head still, face the camera, and speak in a clear, audible voice without background noise.",
  },
  {
    icon: <RightIcon />,
    title:
      "Check your setup – ensure your internet, camera, microphone, and webcam are working properly. Use a fully charged device and set up good lighting so your face is clearly visible before starting.",
  },
  {
    icon: <RightIcon />,
    title:
      "Read & proceed carefully – wait for the AI to finish speaking and read the entire question before answering. The Next button will be enabled 3 seconds after the question audio has been played.",
  },
  {
    icon: <RightIcon />,
    title:
      "Maintain a quiet and professional environment. Avoid unnecessary movements or distractions.",
  },
  {
    icon: <RightIcon />,
    title:
      "Questions will be automatically skipped after 10 seconds if not answered.",
  },
];

const regulations_mcq = [
  {
    icon: <RightIcon />,
    title:
      "Quiet, Professional Setup – Stay in a quiet place with no distractions. Avoid movement and speaking.",
  },
  {
    icon: <WrongIcon />,
    title:
      "Do Not Refresh or Switch Tabs – Refreshing the page or switching tabs will immediately end the test.",
  },
  {
    icon: <RightIcon />,
    title: "Camera Must Be On – Keep your camera on using default settings.",
  },
  {
    icon: <RightIcon />,
    title:
      "Single Participant Only - Only the registered candidate must be visible.",
  },
  {
    icon: <WrongIcon />,
    title:
      "Strict Proctoring - Test is monitored. No external help or devices allowed.",
  },
];

const regulations = [
  {
    icon: <WrongIcon />,
    title:
      "Do not refresh or switch tabs – refreshing the page or switching tabs will end the test automatically.",
  },
  {
    icon: <RightIcon />,
    title:
      "Camera & microphone must be on – keep your camera and microphone on throughout the interview using default system settings.",
  },
  {
    icon: <RightIcon />,
    title:
      "Single participant only & use headphones – only the registered candidate should be visible; headphones are mandatory for clear audio.",
  },
  {
    icon: <WrongIcon />,
    title:
      "Proctoring will be strictly monitored – ensure compliance with guidelines and avoid any external assistance.",
  },
];
const Instructionscomponent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { interview_id, candidate_code } = useParams();
  const [checked, setChecked] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState(
    "Getting Interview Details..."
  );
  const [userNotFound, setUserNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [interviewType, setInterviewType] = useState<string>("");
  const checkForThePermissions = (interview: any) => {
    return checkForInterviewValidations(interview, setLoadingLabel, true);
  };
  const [viewParticipantData, setViewParticipantData] = useState<any>({});
  const getInterviewById = async () => {
    try {
      setLoadingLabel("Getting Interview Details...");
      const response = await getInstructionsByIdAndCandidateCodeAPI({
        interviewId: interview_id as string,
        candidateCode: candidate_code as string,
      });
      if (response.status == 200 || response.status == 201) {
        if (!checkForThePermissions(response?.data?.data)) {
          return;
        }
        const { data } = response.data;
        setViewParticipantData(data);
        setInterviewType(data?.interview?.interview_qb_type);
        if (!data.completed) {
          setLoadingLabel("");
        }
      } else if (response.status == 404 || response.status == 400) {
        setUserNotFound(true);
        const error = response?.data?.message || "Bad Request";
        setErrorMessage(error);
      } else {
        throw response;
      }
    } catch (err) {
      errPopper(err);
    } finally {
    }
  };
  const handleProceedClick = async () => {
    setIsNavigating(true);
    if (interviewType === "SURVEY") {
      await router.push(
        `/join-interview/${interview_id}/candidate/${candidate_code}/bot-interview`
      );
      return;
    }
    const isMobile = pathname.includes("instructions-mobile");
    if (isMobile) {
      await router.push(
        `/join-interview/${interview_id}/candidate/${candidate_code}/source-device-mobile`
      );
    } else {
      await router.push(
        `/join-interview/${interview_id}/candidate/${candidate_code}/source-device-desktop`
      );
    }
  };
  useEffect(() => {
    getInterviewById();
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
    <>
      {!loadingLabel ? (
        <div className="min-h-screen bg-[url('/interview@3x.png')] bg-cover bg-no-repeat bg-top pt-9 pb-9 box-border">
          <Card className="w-[95%] md:w-3/4 mx-auto rounded-2xl bg-white md:bg-white md:shadow-none md:p-6 border-none">
            <CardContent className="p-4 md:p-0">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex flex-col justify-between items-start p-1 md:p-4 w-full md:w-[30%] md:bg-transparent rounded-2xl md:rounded-none shadow-none md:shadow-none">
                  <div className="flex items-start p-1 md:flex md:flex-col gap-3">
                    <Image
                      src={
                        viewParticipantData?.interview?.company?.logo_url ||
                        "/interviews/fig-links-logo.svg"
                      }
                      width={60}
                      height={60}
                      alt="fig-links-logo"
                      className="w-[100px] h-[60px] md:w-[100px] md:h-[100px] object-contain"
                    />
                    <div className="text-base mt-3 md:text-xl 3xl:!text-2xl font-medium md:font-bold md:mt-6 bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78] bg-clip-text text-transparent capitalize w-full">
                      {viewParticipantData?.interview?.title ||
                        "Interview_Title"}
                    </div>
                  </div>
                  <HandIcon className="w-full h-full hidden md:block md:mt-40" />
                </div>
                <div className="flex-1 md:bg-transparent rounded-2xl md:rounded-none shadow-[0px_0px_4px_rgba(0,0,0,0.25)] md:shadow-none p-0 md:p-0">
                  <div className="flex items-center mb-4 bg-gradient-to-r from-[#F7E0FF] to-white gap-1 pl-2 rounded-md">
                    <FileIcon />
                    <p className="text-base md:text-base 3xl:!text-lg font-medium text-black p-2 mt-4 md:mt-0 mb-3 md:mb-0">
                      Interview Guidelines
                    </p>
                  </div>
                  {interviewType === "MCQ" ? (
                    <div className="flex flex-col gap-2 pl-6 pr-3 md:pl-1">
                      {guidelines_mcq?.map((guideline, index) => (
                        <div key={index} className="guidelines flex gap-3.5">
                          <div className="flex-shrink-0">{guideline.icon}</div>
                          <p className="text-sm md:text-sm 3xl:!text-base">
                            {guideline.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 pl-6 pr-3 md:pl-1">
                      {guidelines?.map((guideline, index) => (
                        <div key={index} className="guidelines flex gap-3.5">
                          <div className="flex-shrink-0">{guideline.icon}</div>
                          <p className="text-sm md:text-sm 3xl:!text-base">
                            {guideline.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center mb-4 bg-gradient-to-r from-[#F7E0FF] to-white gap-1 mt-4 pl-2 rounded-md">
                    <FileIcon />
                    <p className="text-base md:text-base 3xl:!text-lg font-medium text-black p-2 mt-4 md:mt-0 mb-3 md:mb-0">
                      Interview Regulations
                    </p>
                  </div>
                  {interviewType === "MCQ" ? (
                    <div className="flex flex-col gap-2 pl-6 pr-3 md:pl-1">
                      {regulations_mcq?.map((regulation, index) => (
                        <div key={index} className="guidelines flex gap-3.5">
                          <div className="flex-shrink-0">{regulation.icon}</div>
                          <p className="text-sm md:text-sm 3xl:!text-base">
                            {regulation.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 pl-6 pr-3 md:pl-1">
                      {regulations?.map((regulation, index) => (
                        <div key={index} className="guidelines flex gap-3.5">
                          <div className="flex-shrink-0">{regulation.icon}</div>
                          <p className="text-sm md:text-sm 3xl:!text-base">
                            {regulation.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4 md:mt-6 pl-2">
                    <Checkbox
                      className="hover:bg-transparent text-white dark:data-[state=checked]:bg-[#a533cf] data-[state=checked]:bg-[#A533CF] data-[state=checked]:border-[#A533CF] border-[#2f80ed] [&>span>svg]:size-4.5"
                      checked={checked}
                      onCheckedChange={(checked) => {
                        setChecked(
                          checked === "indeterminate" ? false : checked
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }
                      }}
                      onKeyUp={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }
                      }}
                      tabIndex={-1}
                    />
                    <p className="text-[#2f80ed] text-[13px] md:text-base 3xl:!text-lg font-normal leading-[150%]">
                      I have read and agree to the above instructions.
                    </p>
                  </div>
                  <div className="p-2">
                    <Button
                      className={`w-full md:w-fit mt-4 md:mt-8 mb-4 px-6 py-1.5 rounded-md text-white capitalize cursor-pointer flex items-center justify-center gap-2 ${
                        checked
                          ? "bg-gradient-to-r from-[#430CA6] via-[#A533CF] to-[#EC6D78]"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                      onClick={
                        checked && !isNavigating
                          ? handleProceedClick
                          : undefined
                      }
                      disabled={!checked || isNavigating}
                    >
                      {isNavigating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Proceeding
                        </>
                      ) : (
                        "Proceed"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Loading label={loadingLabel} loading={!!loadingLabel} />
      )}
    </>
  );
};

export default Instructionscomponent;
