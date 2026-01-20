import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { IDropDownForDevices } from "@/lib/interfaces/meeting";

import { DeviceInfo } from "@videosdk.live/react-sdk";
import Image from "next/image";

export const DropDownForDevices = ({
  selectedDevice,
  onChangeDevice,
  mediaDevicesList,
  iconSrc,
  isPlaying,
  audioProgress,
  testSpeakers,
  id,
}: IDropDownForDevices) => {
  console.log("mediaDevicesList", mediaDevicesList);
  return (
    <Select
      value={selectedDevice}
      onValueChange={onChangeDevice}
      disabled={mediaDevicesList.length === 0}
    >
      <SelectTrigger
        className="w-full h-[34px] md:h-[35px] 
        [&>svg]:
      p-[1px] 
      rounded-sm 
      border border-transparent 
      [background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#EC6D78,#A533CF,#430CA6)_border-box] 
      [background-origin:border-box] 
      [background-clip:padding-box,border-box] 
      bg-white text-xs
      flex items-center justify-between gap-2 font-primary focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      >
        <div className="flex items-center text-ellipsis overflow-hidden whitespace-nowrap gap-1">
          <Image
            src={iconSrc}
            alt="icon"
            width={15}
            height={15}
            className="ml-2"
          />
          <SelectValue
            className="truncate max-w-[calc(100%-20px)] text-ellipsis overflow-hidden whitespace-nowrap"
            placeholder="Select device"
          />
        </div>
      </SelectTrigger>

      <SelectContent
        align="center"
        className="text-xs font-primary font-normal p-2 bg-white cursor-pointer border-0"
      >
        {mediaDevicesList.map((item: DeviceInfo, index: number) => (
          <SelectItem
            key={`${item.groupId}-${index}`}
           value={item.deviceId || `device-${index}`}
            className="text-xs font-primary font-normal p-2 hover:bg-gray-100 bg-white cursor-pointer data-[state=checked]:bg-blue-100 [&>span.absolute.right-2]:hidden"
          >
            {item.label}
          </SelectItem>
        ))}

        {id === "test_speaker" && (
          <div className="">
            <Separator className="my-2" />
            {isPlaying ? (
              <div className="flex justify-start items-center w-[80%]">
                <div
                  className="h-[5px] rounded-l bg-[#d1569c]"
                  style={{ width: `${audioProgress}%` }}
                />
                <div
                  className="h-[5px] rounded-r bg-[#c0c2cc]"
                  style={{ width: `${100 - (audioProgress ?? 0)}%` }}
                />
              </div>
            ) : (
              <Button
                onClick={testSpeakers}
                className="ml-4 rounded bg-[#a533cf33] text-[#a533cf] text-sm font-normal capitalize px-3 py-2 cursor-pointer hover:bg-[#a533cf22]"
              >
                Test Speakers
              </Button>
            )}
          </div>
        )}
      </SelectContent>
    </Select>
  );
};
