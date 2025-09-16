"use client";

import dynamic from "next/dynamic";

const Meeting = dynamic(() => import("@/components/interviews/meeting"), {
  ssr: false,
});

const MeetingPage = () => {
  return <Meeting />;
};

export default MeetingPage;
