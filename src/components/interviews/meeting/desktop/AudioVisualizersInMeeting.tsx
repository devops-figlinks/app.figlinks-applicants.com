import { IAudioVisualizersInMeeting } from "@/lib/interfaces/meeting";
import Rive from "@rive-app/react-canvas";
import Image from "next/image";
import { FC, useEffect, useState } from "react";

const AudioVisualizersInMeeting: FC<IAudioVisualizersInMeeting> = ({
  isActiveSpeaker,
  micOn,
  botSpeechRendered,
  botSpeechDuration,
  rendered,
  interviewData,
  setInterviewData,
  isRecording,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating((prev) => !prev);
    setTimeout(() => {
      setIsAnimating((prev) => !prev);
    }, 100);
  }, []);

  useEffect(() => {
    setIsAnimating((prev) => {
      if (!botSpeechRendered || botSpeechDuration === 0) {
        return isActiveSpeaker && micOn;
      }
      return false;
    });
  }, [isActiveSpeaker, micOn, botSpeechRendered]);


  const getAnimationState = () => {
    return isAnimating ? "Animate" : "Static";
  };
  return (
    <>
      <div className="absolute top-4 right-0 left-0 w-[100%] flex items-start p-4 box-border h-fit" style={{ justifyContent: isRecording ? "space-between" : "flex-end" }}>
        {isRecording ? (<div className="shadow-[0_4px_4px_rgba(0,0,0,0.25)] flex items-center justify-start gap-1.25 bg-white rounded-sm p-0 px-2">
          <Image alt="" src="/interviews/rec-dot.gif" width={15} height={15} />
          <p>Rec</p>
        </div>) : " "}

        <div className="relative w-[30%] max-w-[250px] h-[140px] p-4 rounded-2xl flex justify-center items-center bg-white">
          <div className="w-[180px] h-[180px]">
            {botSpeechRendered ? (
              <Rive
                src="/animated/bot-speech.riv"
                stateMachines={botSpeechDuration ? "Animate" : "Static"}
              />
            ) : null}
          </div>

          {interviewData?.company?.logo ? (
            <Image
              className="absolute left-1/2 transform -translate-x-1/2 object-contain z-10"
              alt="company-logo"
              src={interviewData?.company?.logo}
              height={60}
              onError={() => {
                setInterviewData((prev: any) => ({
                  ...prev,
                  company: {
                    ...prev.company,
                    logo: "/interviews/fig-links-logo.svg",
                  },
                }));
              }}
              width={60}
            />
          ) : (
            <Image
              className="absolute left-1/2 transform -translate-x-1/2 object-contain z-10"
              src={"/interviews/fig-links-logo.svg"}
              width={60}
              height={60}
              alt="fig-links-logo"
            />
          )}
          <Image
            className="w-[100%] absolute !m-0 top-[calc(50%-100px)] left-0 h-[12.5rem] object-contain z-10"
            alt="background-blur"
            src="/interviews/backgroundblur@2x.png"
            width={100}
            height={100}
          />
        </div>
      </div>
      <div className="absolute bottom-[75px] left-4 h-fit">
        {micOn && rendered ? (
          <div className="h-[32px] w-[52px] bg-[#fff] rounded-full"
          >

            <Rive
              key={isAnimating ? "animating" : "static"}
              src="/animated/participant-speech.riv"
              stateMachines={getAnimationState()}
            />

          </div>
        ) : null}
      </div>
    </>
  );
};

export default AudioVisualizersInMeeting;