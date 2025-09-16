"use client";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";

const Rejoin = () => {
  const { interview_id, candidate_code } = useParams();
  const router = useRouter();

  const onRejoinMeeting = async () => {
    router.replace(
      `/join-interview/${interview_id}/candidate/${candidate_code}`
    );
  };
  const onGoToLogin = async () => {
    router.replace(`/`);
  };
  return (
    <div className="flex justify-center items-start pt-8">
      <div>
        <p className="text-sm">You left the interview</p>
        <div className="flex gap-4 p-4 items-center justify-center">
          <Button
            onClick={onRejoinMeeting}
            variant="default"
            className="transform-none px-2 py-4 cursor-pointer"
          >
            {" "}
            Rejoin
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Rejoin;
