import { ICandidateOTPForm } from "@/lib/interfaces/candidates";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { motion } from "framer-motion";
import Image from "next/image";
import { FC } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import OtpInput from "react-otp-input";
import ErrorMessages from "@/components/core/ErrorMessages";
import { LoaderCircle } from "lucide-react";

const CandidateOTPForm: FC<ICandidateOTPForm> = ({
  interviewData,
  onOTPVerify,
  otpLoading,
  setOtp,
  otp,
  isVerified,
  errors,
  onResendOTP,
  resendOTPLoading,
  otpSuccessMessageOrNot,
  seconds,
}) => {
  const safeOtp = otp ?? "";

  return (
    <div className="w-[40%] mx-auto pt-16 max-[1180px]:w-[90%] max-[767px]:w-[90%] max-w-[480px]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          ease: "easeIn",
          duration: 0.6,
        }}
      >
        <Card className="rounded-2xl bg-white shadow-[6px_-3px_9px_rgba(0,0,0,0.08),-3px_13px_16px_rgba(0,0,0,0.15)] backdrop-blur-md py-4 px-5 border-none">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-start justify-between mt-2 gap-4 max-[767px]:hidden">
              <div className="flex flex-col items-start">
                <p
                  className="text-xl 3xl:!text-2xl font-medium text-black capitalize"
                  aria-label="Verify OTP header"
                >
                  Verify OTP
                </p>
                <div className="bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] bg-clip-text text-transparent text-base font-medium capitalize mb-4">
                  {interviewData?.interview?.[0]?.title ||
                    "Interview Title Not Available"}
                </div>
              </div>
              <div className="flex flex-col items-end">
                {interviewData?.company_logo ? (
                  <Image
                    alt=""
                    src={interviewData?.company_logo}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                ) : (
                  <Image
                    src="/interviews/fig-links-logo.svg"
                    width={60}
                    height={60}
                    alt="fig-links-logo"
                    className="object-contain"
                  />
                )}
              </div>
            </div>
            <div className="hidden max-[767px]:block">
              <h2
                className="text-2xl 3xl:!text-3xl font-medium text-black capitalize mb-1"
                aria-label="Verify OTP header"
              >
                Verify OTP
              </h2>
              <div className="text-base 3xl:!text-lg font-medium text-[#430ca6] capitalize mb-3">
                {interviewData?.interview?.[0]?.title ||
                  "Interview Title Not Available"}
              </div>
              {interviewData?.company_logo ? (
                <Image
                  alt=""
                  src={interviewData?.company_logo}
                  width={60}
                  height={60}
                  className="object-contain mb-3 ml-3"
                />
              ) : (
                <Image
                  src="/interviews/fig-links-logo.svg"
                  width={40}
                  height={40}
                  alt="fig-links-logo"
                  className="object-contain mb-3 ml-3"
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isVerified ? (
              <div className="flex flex-col items-center justify-center">
                <object
                  data="/login-success.svg"
                  width={100}
                  height={180}
                  aria-label="Verification successful"
                  className="w-1/2 object-contain"
                />
                <p className="text-2xl sm:text-xl 3xl:!text-3xl font-medium text-black">
                  Verification Successful
                </p>
                <p className="text-lg 3xl:!text-xl font-normal text-black mt-2">
                  We&apos;re redirecting you...
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <div className="text-base 3xl:!text-lg font-normal text-green-700 text-center">
                  {otpSuccessMessageOrNot && (
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-base 3xl:!text-lg font-normal text-green-600 max-[767px]:text-start">
                        OTP has been sent to your email and whatsapp!
                      </p>
                      <p className="text-sm 3xl:!text-base font-normal text-gray-600 mt-2 italic max-[767px]:text-start">
                        Didn&apos;t get a confirmation email? Check your spam
                        folder.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center gap-2 mt-4">
                  <Label
                    className="text-sm 3xl:!text-base font-medium text-[#383838] capitalize"
                    htmlFor="otp"
                  >
                    Enter OTP<span className="text-red-500">*</span>
                  </Label>
                  <OtpInput
                    value={safeOtp}
                    onChange={(e) => setOtp(e)}
                    numInputs={4}
                    shouldAutoFocus={true}
                    renderSeparator={<span style={{ width: "8px" }}></span>}
                    renderInput={(props) => (
                      <input
                        {...props}
                        type="number"
                        aria-label="OTP digit"
                        style={{
                          borderRadius: "4px",
                          border: "1.5px solid",
                          backgroundClip: "padding-box",
                          backgroundOrigin: "border-box",
                          color: "black",
                          fontWeight: 400,
                          fontSize: "16px",
                          boxSizing: "border-box",
                          fontFamily: "Arial, sans-serif",
                          width: "40px",
                          height: "40px",
                          padding: "0 8px",
                          textAlign: "center",
                          transition: "border 0.3s, background 0.3s",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                      />
                    )}
                  />
                  <ErrorMessages errorMessages={errors} keyname="otp" />
                </div>
                <div className="flex justify-end items-center gap-4 mt-10 max-[767px]:mt-6">
                  <Button
                    className={` ${
                      seconds ? "opacity-50 cursor-not-allowed" : ""
                    } px-4 py-2 rounded-lg border border-[#a533cf] bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] bg-clip-text text-transparent text-sm 3xl:!text-base font-medium capitalize cursor-pointer`}
                    onClick={onResendOTP}
                    disabled={!!seconds}
                    aria-label="Resend OTP"
                  >
                    {resendOTPLoading ? (
                      <div className="flex items-center justify-center">
                        <LoaderCircle className="text-[#ec6d78] animate-spin w-8" />
                      </div>
                    ) : seconds ? (
                      `Resend OTP in ${seconds}(s)`
                    ) : (
                      "Resend OTP"
                    )}
                  </Button>
                  <Button
                    className="px-5 py-2 rounded-lg cursor-pointer bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] text-white text-sm 3xl:!text-base font-normal capitalize shadow-[0_0_24px_rgba(153,23,255,0.1),0_0_1px_4px_rgba(255,255,255,0.1)] max-[500px]:px-3 max-[500px]:py-1.5 max-[500px]:text-sm text-center"
                    onClick={onOTPVerify}
                    aria-label="Verify OTP"
                  >
                    {otpLoading ? (
                      <div className="flex items-center justify-center">
                        <LoaderCircle className="text-white animate-spin" />
                      </div>
                    ) : (
                      <>
                        Verify
                        <AutoAwesomeIcon className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-0 mt-6 flex items-center justify-center">
            <p
              className="text-[13px] 3xl:!text-[15px] font-normal text-[#00000099] text-center leading-tight"
              aria-label="Terms and privacy agreement"
            >
              By clicking “Submit” I agree to FigLinks
              <span className="underline"> Terms of Use</span>,
              <span className="underline"> Privacy Policy</span>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default CandidateOTPForm;
