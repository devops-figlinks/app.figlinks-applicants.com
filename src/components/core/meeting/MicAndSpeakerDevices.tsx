import { IMicAndSpeakerDevices } from "@/lib/interfaces/meeting";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DeviceInfo } from "@videosdk.live/react-sdk";
import Image from "next/image";
import { FC } from "react";

const MicAndSpeakerDevices: FC<IMicAndSpeakerDevices> = ({
  micAnchorEL,
  audioDevicesList,
  selectedMicInMeet,
  playbackDevicesList,
  selectedSpeakerInMeet,
  onChanceMicInMeeting,
  setMicAnchorEl,
  onChangeSpeakerInMeeting,
}) => {
  return (
    <DropdownMenu open={!!micAnchorEL} onOpenChange={() => setMicAnchorEl(null)}>
      <DropdownMenuContent
        align="start"
        className="p-2 rounded-[10px] w-[300px] bg-background shadow-lg border z-20"
      >
        <DropdownMenuLabel className="text-sm font-medium text-white md:text-black">
          Microphone
        </DropdownMenuLabel>
        {audioDevicesList?.map((item: DeviceInfo, index: number) => (
          <DropdownMenuItem
            key={item.groupId + index}
            className={cn(
              "text-[13px] font-medium text-white md:text-black flex items-center gap-1.5 hover:bg-transparent focus:bg-transparent",
              selectedMicInMeet === item.deviceId ? "text-[#2077E9] pl-0" : "pl-4"
            )}
            onClick={() => onChanceMicInMeeting(item.deviceId)}
          >
            {selectedMicInMeet === item.deviceId && (
              <Image src="/interviews/tick.svg" alt="tick" width={13} height={13} />
            )}
            {item?.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-sm font-medium text-white md:text-black">
          Speakers
        </DropdownMenuLabel>
        {playbackDevicesList?.map((item: DeviceInfo, index: number) => (
          <DropdownMenuItem
            key={item.groupId + index}
            className={cn(
              "text-[13px] font-medium text-white md:text-black flex items-center gap-1.5 hover:bg-transparent focus:bg-transparent",
              selectedSpeakerInMeet === item.deviceId ? "text-[#2077E9] pl-0" : "pl-4"
            )}
            onClick={() => onChangeSpeakerInMeeting(item.deviceId)}
          >
            {selectedSpeakerInMeet === item.deviceId && (
              <Image src="/interviews/tick.svg" alt="tick" width={13} height={13} />
            )}
            {item?.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MicAndSpeakerDevices;
