import { useEffect } from "react";

export const useDisableZoom = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "=" || event.key === "-" || event.key === "0")
      ) {
        event.preventDefault();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    const handleGestureStart = (event: TouchEvent) => {
      event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });

    window.addEventListener(
      "gesturestart",
      handleGestureStart as EventListener
    );

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener(
        "gesturestart",
        handleGestureStart as EventListener
      );
    };
  }, []);
};
