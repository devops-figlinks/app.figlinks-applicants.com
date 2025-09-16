import { DeviceInfo } from "@videosdk.live/react-sdk";
import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import Image from "next/image";

const StreamVideoPlayer = ({
  videoStream,
  height,
  width,
  selectedCam,
  videoDevicesList,
}: {
  videoStream: MediaStream | string;
  height: string;
  width: string;
  selectedCam?: string;
  videoDevicesList?: DeviceInfo[];
}) => {
  const [isMirrorOrNot, setMirrorOrNot] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playTokenRef = useRef(0);

  useEffect(() => {
    if (selectedCam && videoDevicesList) {
      videoDevicesList.forEach((item) => {
        if (item.deviceId === selectedCam) {
          if (item.label.includes("facing back")) {
            setMirrorOrNot(false);
          } else {
            setMirrorOrNot(true);
          }
        }
      });
    }
  }, [selectedCam, videoDevicesList]);

  const getWatermarkSize = () => {
    const baseWidth = parseFloat(width) || 100;
    const baseHeight = parseFloat(height) || 100;
    const scaleFactor = 1.5;
    const aspectRatio = 130 / 50;
    const minWidth = 50;
    const maxWidth = 200;

    let watermarkWidth = baseWidth * scaleFactor;
    watermarkWidth = Math.max(minWidth, Math.min(maxWidth, watermarkWidth));
    const watermarkHeight = watermarkWidth / aspectRatio;

    return { width: watermarkWidth, height: watermarkHeight };
  };

  const { width: watermarkWidth, height: watermarkHeight } = getWatermarkSize();

  useEffect(() => {
    if (videoRef.current && videoStream && typeof videoStream !== "string") {
      const element = videoRef.current;
      const token = ++playTokenRef.current;
      try {
        element.muted = true;
        element.autoplay = true;
        element.playsInline = true as any;
        element.srcObject = videoStream as MediaStream;
        const playPromise = element.play();
        if (playPromise && typeof (playPromise as any).then === "function") {
          (playPromise as Promise<void>).catch((err) => {
            if (token !== playTokenRef.current || !element.isConnected) return;
            if (
              (err &&
                (err.name === "AbortError" || (err as any).code === 20)) ||
              /AbortError/i.test(String(err))
            ) {
              return;
            }
            console.error("video play() failed", err);
          });
        }
      } catch (err) {
        console.error("Error attaching MediaStream to video element", err);
      }
      return () => {
        playTokenRef.current++;
        try {
          element.pause();
        } catch {}
        element.srcObject = null;
      };
    }
  }, [videoStream]);

  return (
    <div style={{ position: "relative", width, height, background: "#000" }}>
      {typeof videoStream === "string" ? (
        <ReactPlayer
          className="[&_video]:rounded-xl [&_video]:object-cover w-[100%] h-[100%]"
          style={
            isMirrorOrNot
              ? { transform: "scaleX(-1)", WebkitTransform: "scaleX(-1)" }
              : {}
          }
          playsInline
          pip={false}
          light={false}
          controls={false}
          muted={true}
          playing={true}
          src={videoStream}
          height={height}
          width={width}
          onError={() => {}}
        />
      ) : (
        <video
          ref={videoRef}
          className="rounded-xl object-cover w-[100%] h-[100%]"
          style={
            isMirrorOrNot
              ? { transform: "scaleX(-1)", WebkitTransform: "scaleX(-1)" }
              : {}
          }
          muted
          playsInline
          autoPlay
          controls={false}
        />
      )}
      {/* {videoStream ? (
        <Image
          src="/figlinkslogo.svg"
          alt="Watermark"
          width={watermarkWidth}
          height={watermarkHeight}
          className={`
            absolute top-0 left-3 opacity-80 rounded-md px-2 py-2 pointer-events-none select-none transition-opacity duration-300 hover:opacity-60 max-w-[20vw] max-h-[10vh] z-10
          `}
          style={{
            width: `${watermarkWidth}px`,
            height: `${watermarkHeight}px`,
          }}
          onError={() => {}}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          No video stream available
        </div>
      )} */}
    </div>
  );
};

export default StreamVideoPlayer;
