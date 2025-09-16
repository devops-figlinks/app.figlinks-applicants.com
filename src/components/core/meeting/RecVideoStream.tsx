import ReactPlayer from "react-player";
import { useEffect, useRef, useRef as ReactUseRef } from "react";

const RecVideoStream = ({
  videoStream,
  height,
  width,
  ...rest
}: {
  videoStream: string | MediaStream;
  height: string;
  width: string;
  controls: boolean;
  muted: boolean;
  playing: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playTokenRef = useRef(0);

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
            if ((err && (err.name === "AbortError" || (err as any).code === 20)) || /AbortError/i.test(String(err))) {
              return;
            }
            console.error("recorded video play() failed", err);
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
    <>
      {typeof videoStream === "string" ? (
        <ReactPlayer
          {...rest}
          pip={false}
          light={false}
          src={videoStream}
          height={height}
          width={width}
          onError={(err) => {
            console.error(err, " participant video error");
          }}
          className="[&_video]:object-cover [&_video]:rounded-lg"
        />
      ) : (
        <video
          ref={videoRef}
          className="object-cover rounded-lg"
          muted
          playsInline
          autoPlay
          controls={false}
        />
      )}
    </>
  );
};

export default RecVideoStream;
