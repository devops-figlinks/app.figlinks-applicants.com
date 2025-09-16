import { IAudioVisualizersInMeeting } from "@/lib/interfaces/meeting";
import Rive from "@rive-app/react-canvas";
import Image from "next/image";
import { FC, useEffect, useState } from "react";

const MobileAudioVisualizersInMeeting: FC<IAudioVisualizersInMeeting> = ({
  isActiveSpeaker,
  micOn,
  botSpeechRendered,
  botSpeechDuration,
  rendered,
  interviewData,
  setInterviewData,
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
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-start px-4 box-border h-fit z-10">
        <div className="relative h-[120px] w-[120px]">
          {botSpeechDuration && botSpeechRendered ? (
            <>
              <Rive
                src="/animated/mobile-bot-speech.riv"
                stateMachines={botSpeechDuration ? "Animate" : "Static"}
              />

              {interviewData?.company?.logo ? (
                <Image
                  className="absolute m-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain z-10"
                  alt=""
                  src={interviewData?.company?.logo}
                  height={35}
                  onError={() => {
                    setInterviewData((prev: any) => ({
                      ...prev,
                      company: {
                        ...prev.company,
                        logo: "/interviews/fig-links-logo.svg",
                      },
                    }));
                  }}
                  width={35}
                />
              ) : (
                <Image
                  className="absolute m-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain z-10"
                  src={"/interviews/fig-links-logo.svg"}
                  width={35}
                  height={35}
                  alt="fig-links-logo"
                />
              )}
            </>
          ) : (
            ""
          )}

          {!botSpeechDuration && micOn && rendered ? (
            <Rive
            key={isAnimating ? "animating" : "static"} 
              src="/animated/mobile-mic-speech.riv"
              stateMachines={getAnimationState()}
            />
          ) : (
            ""
          )}
        </div>
    </div>
  );
};

export default MobileAudioVisualizersInMeeting;
