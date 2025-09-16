import { isMobile } from "@/helpers/popper/deviceDetection";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const MediatorScreen = async ({
  params,
}: {
  params: { interview_id: string; candidate_code: string };
}) => {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const mobileCheck = isMobile(userAgent);

  if (mobileCheck) {
    redirect(
      `/join-interview/${params.interview_id}/candidate/${params.candidate_code}/instructions-mobile`
    );
  } else {
    redirect(
      `/join-interview/${params.interview_id}/candidate/${params.candidate_code}/instructions`
    );
  }
  return null;
};

export default MediatorScreen;
