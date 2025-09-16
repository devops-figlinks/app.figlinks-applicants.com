"use client";
import useMediaStream from "@/lib/hooks/useMediaStream";
import {
  CameraDeviceInfo,
  DeviceInfo,
  MicrophoneDeviceInfo,
  useMediaDevice,
  createCameraVideoTrack,
  createMicrophoneAudioTrack,
  getNetworkStats,
} from "@videosdk.live/react-sdk";
import { PlaybackDeviceInfo } from "@videosdk.live/react-sdk/dist/types/deviceInfo";
import { Permission } from "@videosdk.live/react-sdk/dist/types/permission";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";

import { useEffect, useRef, useState } from "react";

let path = "/test_sound.mp3";

interface IPermissions {
  checkPermissions: (
    permissions?: Permission | undefined | any
  ) => Promise<Map<string, boolean>>;
  requestPermission: (
    permissions?: Permission | undefined | any
  ) => Promise<Map<string, boolean>>;
  getCameras: () => Promise<CameraDeviceInfo[]>;
  getMicrophones: () => Promise<MicrophoneDeviceInfo[]>;
  getPlaybackDevices: () => Promise<PlaybackDeviceInfo[]>;
}
const VideoSDK = () => {
  const {
    checkPermissions,
    requestPermission,
    getCameras,
    getMicrophones,
    getPlaybackDevices,
  }: IPermissions = useMediaDevice({ onDeviceChanged });
  const { getAudioTrack } = useMediaStream();
  const [audioDevicesList, setAudioDevicesList] = useState<DeviceInfo[]>([]);
  const [videoDevicesList, setVideoDevicesList] = useState<DeviceInfo[]>([]);
  const [playbackDevicesList, setPlaybackDevicesList] = useState<DeviceInfo[]>(
    []
  );
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedCam, setSelectedCam] = useState<string>("");
  const [selectedPlayback, setSelectedPlayback] = useState<string>("");
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const audioAnalyserIntervalRef = useRef<number | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);

  function onDeviceChanged(devices: Promise<DeviceInfo[]>) {}

  const checkMediaPermission = async () => {
    try {
      await checkPermissions("audio");
      await checkPermissions("video");
      await checkPermissions("audio_video");

      await requestPermission("audio");
      await requestPermission("video");
      await requestPermission("audio_video");

      let webcams = await getCameras();
      setVideoDevicesList(webcams);
      let mics = await getMicrophones();
      setAudioDevicesList(mics);
      let speakers = await getPlaybackDevices();
      setPlaybackDevicesList(speakers);
    } catch (ex) {
      console.error("Error in requestPermission ", ex);
    }
  };

  const getMediaTracks = async () => {
    try {
      const customVideoStream = await createCameraVideoTrack({
        cameraId: selectedCam,
        encoderConfig: "h540p_w960p",
        optimizationMode: "motion",
        multiStream: false,
      });
      setVideoStream(customVideoStream);

      const videoTracks = customVideoStream?.getVideoTracks();
      const videoTrack = videoTracks.length ? videoTracks[0] : null;
    } catch (error) {
      console.error("Error getting media tracks", error);
    }
  };

  const getNetworkStatistics = async () => {
    try {
      const options = { timeoutDuration: 45000 };
      const networkStats = await getNetworkStats(options);

      const downloadSpeed = networkStats["downloadSpeed"];
      const uploadSpeed = networkStats["uploadSpeed"];
    } catch (ex) {
      console.error("Error getting network stats", ex);
    }
  };

  const [customAudioStream, setCustomAudioStream] =
    useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);

  const changeMic = async (deviceId: string) => {
    if (micOn) {
      const currentAudioTrack = audioTrackRef.current;
      currentAudioTrack && currentAudioTrack.stop();
      const stream = await getAudioTrack({
        micId: deviceId,
      });
      setCustomAudioStream(stream);
      const audioTracks = stream?.getAudioTracks();
      const audioTrack = audioTracks?.length ? audioTracks[0] : null;
      if (audioAnalyserIntervalRef.current) {
        clearInterval(audioAnalyserIntervalRef.current);
        audioAnalyserIntervalRef.current = null;
      }
      setAudioTrack(audioTrack);
      audioTrackRef.current = audioTrack;
    }
  };

  useEffect(() => {
    checkMediaPermission();
    getMediaTracks();
    getNetworkStatistics();
  }, [selectedCam]);

  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<HTMLAudioElement | null>(null);

  const testSpeakers = () => {
    const selectedSpeakerDeviceId = selectedPlayback;
    if (selectedSpeakerDeviceId) {
      const audio: HTMLAudioElement = new Audio(path);
      setAudioBlob(audio);

      try {
        if (audio && typeof audio.setSinkId === "function") {
          audio
            .setSinkId(selectedSpeakerDeviceId)
            .then(() => {
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    setIsPlaying(true);
                    audio.addEventListener("timeupdate", () => {
                      const progress =
                        (audio.currentTime / audio.duration) * 100;
                      setAudioProgress(progress);
                    });
                    audio.addEventListener("ended", () => {
                      setAudioProgress(0);
                      setIsPlaying(false);
                    });
                  })
                  .catch((error) => {
                    console.warn("Playback was interrupted or failed:", error);
                    setIsPlaying(false);
                  });
              }
            })
            .catch((error) => {
              console.error("Failed to set sinkId:", error);
            });
        } else {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                audio.addEventListener("timeupdate", () => {
                  const progress = (audio.currentTime / audio.duration) * 100;
                  setAudioProgress(progress);
                });
                audio.addEventListener("ended", () => {
                  setAudioProgress(0);
                  setIsPlaying(false);
                });
              })
              .catch((error) => {
                console.warn("Playback was interrupted or failed:", error);
                setIsPlaying(false);
              });
          }
          console.warn("setSinkId is not supported on this browser.");
        }
      } catch (error) {
        console.error("Error during testSpeakers playback", error);
      }
    } else {
      console.error("Selected speaker deviceId not found.");
    }
  };

  const handlePlaybackDeviceChange = async (value: string) => {
    setSelectedPlayback(value);

    const mediaElements = Array.from(
      document.querySelectorAll<HTMLMediaElement>("audio, video")
    );

    let success = true;

    for (const mediaElement of mediaElements) {
      if (mediaElement && "setSinkId" in mediaElement) {
        try {
          await mediaElement.setSinkId(value);
        } catch (err) {
          console.error("Failed to set audio output device:", err);
          success = false;
        }
      } else {
        console.error("setSinkId not supported or media element inaccessible.");
        success = false;
      }
    }

    if (success) {
    } else {
    }
  };

  return (
    <>
      <Select
        value={selectedMic}
        onValueChange={(value) => {
          setSelectedMic(value);
          changeMic(value);
        }}
      >
        <SelectTrigger className="w-full mb-4">
          <SelectValue placeholder="Select Audio Device" />
        </SelectTrigger>
        <SelectContent>
          {audioDevicesList?.length
            ? audioDevicesList.map((item) => (
                <SelectItem key={item.deviceId} value={item.deviceId}>
                  {item?.label}
                </SelectItem>
              ))
            : null}
        </SelectContent>
      </Select>
      <Select
        value={selectedCam}
        onValueChange={(value) => setSelectedCam(value)}
      >
        <SelectTrigger className="w-full mb-4">
          <SelectValue placeholder="Select Video Device" />
        </SelectTrigger>
        <SelectContent>
          {videoDevicesList.length
            ? videoDevicesList.map((item) => (
                <SelectItem key={item.groupId} value={item.deviceId}>
                  {item?.label}
                </SelectItem>
              ))
            : null}
        </SelectContent>
      </Select>
      <Select
        value={selectedPlayback}
        onValueChange={handlePlaybackDeviceChange}
      >
        <SelectTrigger className="w-full mb-4">
          <SelectValue placeholder="Select Playback Device" />
        </SelectTrigger>
        <SelectContent>
          {playbackDevicesList.length
            ? playbackDevicesList.map((item) => (
                <SelectItem key={item.groupId} value={item?.deviceId}>
                  {item?.label}
                </SelectItem>
              ))
            : null}
        </SelectContent>
        <div className="pt-2">
          <Button
            variant="ghost"
            className="flex w-full text-left mb-1 pl-1 focus:outline-none cursor-pointer"
            onClick={testSpeakers}
          >
            <span className="mr-3 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="#fff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M15.892 4.108a8.333 8.333 0 010 11.784M12.95 7.05a4.167 4.167 0 010 5.892M9.167 4.167L5 7.5H1.667v5H5l4.167 3.333V4.167z"
                />
              </svg>
            </span>
            {isPlaying ? (
              <div className="w-52 mt-2 bg-gray-500 rounded-full h-2">
                <div
                  className="bg-white opacity-50 h-2 rounded-full"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            ) : (
              <span>Test Speakers</span>
            )}
          </Button>
        </div>
      </Select>
    </>
  );
};

export default VideoSDK;
