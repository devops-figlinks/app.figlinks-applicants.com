import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ICameraDropDownInMeeting } from "@/lib/interfaces/meeting";
import { DeviceInfo } from "@videosdk.live/react-sdk";
import Image from "next/image";
import { FC } from "react";

const CamDevices: FC<ICameraDropDownInMeeting> = ({
  cameraAnchorEL,
  videoDevicesList,
  selectedCamInMeet,
  setCameraAnchorEl,
  onChangeWebCamInMeeting,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className="  px-4 py-2 rounded-[10px] w-[300px] z-20
    bg-white text-sm font-primary font-medium
    text-left"
      >
     
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[300px] p-2 rounded-[10px] bg-white shadow">
        {videoDevicesList?.map((item: DeviceInfo, index: number) => (
          <DropdownMenuItem
            key={item.groupId + index}
            onClick={() => onChangeWebCamInMeeting(item.deviceId)}
            className={`
          text-[13px] font-primary font-medium 
          whitespace-normal flex items-center gap-[5px]
          min-h-[inherit] cursor-pointer
          ${
            selectedCamInMeet === item.deviceId
              ? "text-[#2077E9] pl-0"
              : "text-black pl-4"
          }
        `}
          >
            {selectedCamInMeet === item.deviceId && (
              <Image
                src="/interviews/tick.svg"
                alt="tick"
                width={13}
                height={13}
              />
            )}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CamDevices;
