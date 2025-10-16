"use client";
import { errPopper } from "@/helpers/popper/errPopper";
import { successPopper } from "@/helpers/popper/successPopper";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "../core/Loading";
import { submitReviewAPI } from "@/https/services/interviews";

const RatingAndReview = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const interview_id = (params.interview_id as string) || searchParams.get("interview_id") || "";
  const candidate_code = (params.candidate_code as string) || searchParams.get("candidate_code") || "";

  const [review, setReview] = useState("");
  const [rating, setRating] = useState<number | null>(0);
  const [hover, setHover] = useState(-1);
  const [starColor, setStarColor] = useState("#faaf00");
  const [loading, setLoading] = useState(false);
  const [endCall, setEndCall] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEndCall(params.get("endCall"));
  }, []);

  const ratingColors: Record<number, string> = {
    1.0: "#FF1A00",
    2.0: "#FF5000",
    3.0: "#FF8500",
    4.0: "#FAAF00",
    5.0: "#FFD500",
  };

  const onSubmitReview = async () => {
    if (!interview_id || !candidate_code) {
      errPopper("Missing interview details. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const body = {
        c_review: review,
        c_rating: rating,
      };
      const response = await submitReviewAPI({
        interviewId: interview_id,
        candidateCode: candidate_code,
        body,
      });

      if (response.status == 200 || response.status == 201) {
        successPopper("Thank you for your feedback");
        router.replace("/interview-final-page");
      } else {
        throw response;
      }
    } catch (err) {
      errPopper(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hover >= 0 && hover in ratingColors) {
      setStarColor(ratingColors[hover]);
    }
    else if (rating && rating in ratingColors) {
      setStarColor(ratingColors[rating]);
    }
  }, [hover, rating]);

  return (
    <div className="h-screen bg-[url('/interview@3x.png')] bg-cover bg-no-repeat bg-top pb-2 box-border flex items-start justify-center px-4 sm:p-5">
      <Card className="w-full max-w-4xl rounded-2xl bg-transparent shadow-none sm:shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] sm:backdrop-blur-[7.5px] sm:p-4 sm:bg-white sm:border-none border-none">
        <CardContent className="p-4 sm:p-0">
          <p className="text-center text-[#b91c1c] text-sm 3xl:!text-base font-medium p-2 sm:p-2 transition-all duration-300 ease-in-out">
            <span className="text-sm sm:text-sm 3xl:!text-base">
              {endCall
                ? "Your interview was submitted due to face not detected."
                : ""}
            </span>
          </p>
          <div className="w-full sm:w-[62%] mx-auto text-center">
            <div className="bg-white rounded-lg p-2 sm:p-2">
              <div className="flex flex-col items-center justify-center">
                <Image
                  loading="eager"
                  alt="Success Image"
                  src="/interviews/successimage.svg"
                  width={100}
                  height={100}
                  className="mb-4 sm:w-[200px] sm:h-[200px] sm:mb-0"
                />
                <p className="text-center font-medium text-sm sm:text-[17px] 3xl:!text-lg leading-[150%] text-black">
                  <span className="text-[#009a2b]">Thank you </span>
                  for completing your interview we will review all candidates
                  and contact you with any updates or next steps.
                </p>
              </div>
              <div className="mt-3 sm:mt-6 text-center">
                <p className="text-black text-xs sm:text-[17px] 3xl:!text-base font-normal leading-[100%] hidden sm:block">
                  Rate This Interview
                </p>
                <div className="flex justify-center space-x-2 text-[1.8rem] sm:text-3xl">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <span
                      key={value}
                      className="cursor-pointer transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
                      style={{
                        color:
                          value <= (hover || (rating ?? 0))
                            ? starColor
                            : "#d1d5db",
                      }}
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHover(value)}
                      onMouseLeave={() => setHover(rating ?? 0)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div className="rounded-lg border border-white sm:border sm:border-[#dcdcde] sm:bg-[#f7f7f9] flex flex-col gap-2 p-2 mt-2 sm:mt-4">
                  <Textarea
                    className="text-xs sm:text-base 3xl:!text-lg p-2 sm:p-1 resize-none focus-visible:ring-0 border border-[#dcdcde] shadow-none sm:border-none rounded-md sm:shadow-none min-h-[70px] flex-start bg-[#f7f7f9] placeholder:text-black/40"
                    rows={3}
                    placeholder="Write your review"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className={`rounded text-xs sm:text-sm 3xl:!text-base font-normal leading-[100%] capitalize px-3 py-1.5 sm:px-2.5 sm:py-2 mb-1 sm:mb-3.2 mr-1 sm:mr-3.2 ml-auto border w-fit cursor-pointer ${!rating
                        ? "border-[#969696] text-[#aeaeae] disabled"
                        : "border-[#430ca6] text-[#430ca6] sm:border-[#430ca6] sm:text-[#430ca6] active"
                      }`}
                    onClick={onSubmitReview}
                    disabled={!rating}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 sm:mt-8 mobile sm:web sm:mb-4">
              <div className="rounded-2xl sm:bg-[#f0f0f2] bg-white p-4 flex flex-col justify-between">
                <p className="text-black text-sm sm:text-[17px] 3xl:!text-xl font-normal leading-[100%] mb-0 text-center">
                  Any questions, feel free to reach out to us
                </p>
                <div className="flex items-center justify-center gap-3 mt-3 sm:mt-4">
                  <Image
                    alt="Call Icon"
                    src="/interviews/callicon1.svg"
                    width={25}
                    height={25}
                  />
                  <Image
                    alt="Email Icon"
                    src="/interviews/emailicon1.svg"
                    width={25}
                    height={25}
                  />
                </div>
              </div>
              <div className="rounded-2xl sm:bg-[#f0f0f2] bg-white p-4 flex flex-col justify-between">
                <p className="text-black text-sm sm:text-[17px] 3xl:!text-xl font-normal leading-[100%] mb-0 text-center">
                  Follow Us On
                </p>
                <div className="flex items-center justify-center gap-3 mt-3 sm:mt-4">
                  <a
                    href="https://www.facebook.com/profile.php?id=61569209646109#"
                    target="_blank"
                  >
                    <Image
                      alt="facebook icon"
                      src="/interviews/fb.png"
                      width={25}
                      height={25}
                    />
                  </a>
                  <a
                    href="https://www.instagram.com/figlinks_ai_interviews/"
                    target="_blank"
                  >
                    <Image
                      alt="Instagram Icon"
                      src="/interviews/instagramiocn1.svg"
                      width={25}
                      height={25}
                    />
                  </a>
                  <a href="https://x.com/figlinks" target="_blank">
                    <Image
                      alt="X Logo"
                      src="/interviews/xlogo1.svg"
                      width={25}
                      height={25}
                    />
                  </a>
                  <a
                    href="https://www.youtube.com/@FigLinksOnline"
                    target="_blank"
                  >
                    <Image
                      alt="YouTube Icon"
                      src="/interviews/youtubeicon1.svg"
                      width={25}
                      height={25}
                    />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/figlinksonline"
                    target="_blank"
                  >
                    <Image
                      alt="LinkedIn Icon"
                      src="/interviews/linkedinicon1.svg"
                      width={25}
                      height={25}
                    />
                  </a>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 hidden sm:hidden mobile">
              <div className="rounded-2xl bg-[#f0f0f2] p-4 flex flex-col justify-between">
                <p className="text-black text-sm 3xl:!text-lg font-normal leading-[100%] mb-0 text-center">
                  Any questions, feel free to reach out to us
                </p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <Image
                    alt="Call Icon"
                    src="/interviews/callicon1.svg"
                    width={25}
                    height={25}
                  />
                  <Image
                    alt="Email Icon"
                    src="/interviews/emailicon1.svg"
                    width={25}
                    height={25}
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-[#f0f0f2] p-4 flex flex-col justify-between">
                <p className="text-black text-sm 3xl:!text-lg font-normal leading-[100%] mb-0 text-center">
                  Follow Us On
                </p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <a
                    href="https://www.facebook.com/profile.php?id=61569209646109#"
                    target="_blank"
                  >
                    <Image
                      alt="facebook icon"
                      src="/interviews/fb.png"
                      width={25}
                      height={25}
                    />
                  </a>
                  <a
                    href="https://www.instagram.com/figlinks_ai_interviews/"
                    target="_blank"
                  >
                    <Image
                      alt="Instagram Icon"
                      src="/interviews/instagramiocn1.svg"
                      width={25}
                      height={25}
                    />
                  </a>
                  <a href="https://x.com/figlinks" target="_blank">
                    <Image
                      alt="X Logo"
                      src="/interviews/xlogo1.svg"
                      width={25}
                      height={25}
                    />
                  </a>
                  <a
                    href="https://www.youtube.com/@FigLinksOnline"
                    target="_blank"
                  >
                    <Image
                      alt="YouTube Icon"
                      src="/interviews/youtubeicon1.svg"
                      width={25}
                      height={25}
                    />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/figlinksonline"
                    target="_blank"
                  >
                    <Image
                      alt="LinkedIn Icon"
                      src="/interviews/linkedinicon1.svg"
                      width={25}
                      height={25}
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Loading loading={loading} label="Submitting Review..." />
    </div>
  );
};

export default RatingAndReview;