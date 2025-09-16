import StreamVideoPlayer from "@/components/core/meeting/StreamVideoPlayer";
import { Avatar } from "@/components/ui/avatar";
import { stringAvatar } from "@/helpers/muiAvatar";
import useParticipantHook from "@/lib/hooks/meeting/useParticipantHook";
import {
  IuseParticipantHookReturnType,
  ParticipantViewProps,
} from "@/lib/interfaces/meeting";

function McqParticipantView(props: ParticipantViewProps) {
  const { participantId } = props;

  const {
    webcamOn,
    videoStream,
    participantName,
  }: IuseParticipantHookReturnType = useParticipantHook(props);

  // return (
  //     <div
  //         key={participantId}
  //         className={webcamOn ? "w-[100%] h-[100%]" : "w-[100%] h-[100%] flex justify-center items-center !important"} >
  //         {webcamOn ? (
  //             <StreamVideoPlayer
  //                 videoStream={videoStream as MediaStream | string}
  //                 height={"100%"}
  //                 width={"100%"}
  //             />
  //         ) : (
  //             <div className="!w-[100px] !h-[100px]">
  //                 <Avatar {...stringAvatar(participantName as string)} />
  //             </div>
  //         )}
  //     </div>
  // );
  return (
    <div
      key={participantId}
      className={`${
        webcamOn
          ? "w-[100px] h-[80px] md:w-full md:h-full rounded-lg md:rounded-none"
          : "w-[100px] h-[100px] md:w-full md:h-full flex justify-center items-center"
      }`}
    >
      {webcamOn ? (
        <div className="rounded-lg w-full h-full">
          <StreamVideoPlayer
            videoStream={videoStream as MediaStream | string}
            height="100%"
            width="100%"
          />
        </div>
      ) : (
        <div className="w-[100px] h-[100px] md:w-full md:h-full flex justify-center items-center">
          <Avatar {...stringAvatar(participantName as string)} />
        </div>
      )}
    </div>
  );
}

export default McqParticipantView;
