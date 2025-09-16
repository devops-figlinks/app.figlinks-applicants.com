import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { motion } from "framer-motion";
import Image from "next/image";
import ErrorMessages from "@/components/core/ErrorMessages";
import { ChangeEvent, FC } from "react";
import { ICandidateForm } from "@/lib/interfaces/candidates";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

const CandidateForm: FC<ICandidateForm> = ({
  loading,
  interviewData,
  candidateDetails,
  errors,
  submitLoading,
  onSubmit,
  setCandidateDetails,
  setInterviewData,
}) => {
  const onTextFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "fname" || name === "lname") {
      let cleanValue = value.replace(/[^a-zA-Z\s]/g, "");
      cleanValue = cleanValue.replace(/^\s+/, "").replace(/\s{2,}/g, " ");
      formattedValue = cleanValue.replace(/\b\w/g, (char: string) => char.toUpperCase());
    } else if (name === "phone") {
      formattedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setCandidateDetails({ ...candidateDetails, [name]: formattedValue });
  };

  return (
    <div className="w-[40%] mx-auto pt-16 max-[1180px]:w-[90%] max-[767px]:w-[90%]">
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            ease: "easeIn",
            duration: 0.6,
          }}
        >
          <Card className="border-none rounded-2xl relative z-10 bg-white shadow-[6px_-3px_9px_rgba(0,0,0,0.08),-3px_13px_16px_rgba(0,0,0,0.15)] backdrop-blur-md px-5 py-4">
            <CardHeader className="p-0">
              <p className="text-lg 3xl:!text-xl font-medium text-black capitalize mb-2">
                Register to take interview
              </p>
              <p className="text-xs 3xl:!text-sm font-medium text-[#000000cc] capitalize leading-tight">
                Please fill in your details to get started with the interview process.
              </p>
            </CardHeader>
            <div className="flex items-start justify-between mt-8 gap-4 max-[767px]:hidden">
              <div className="flex flex-col">
                <div className="bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] bg-clip-text text-transparent text-lg 3xl:!text-xl font-medium capitalize mb-4">
                  {interviewData?.interview?.[0]?.title}
                </div>
              </div>
              <div className="flex flex-col items-end">
                {interviewData?.company_logo ? (
                  <Image
                    alt=""
                    src={interviewData?.company_logo || "/interviews/fig-links-logo.svg"}
                    width={80}
                    height={80}
                    className="object-contain"
                    onError={() => {
                      setInterviewData((prev: typeof interviewData) => ({
                        ...prev,
                        company: {
                          ...prev.company,
                          logo: "/interviews/fig-links-logo.svg",
                        },
                      }));
                    }}
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
              <div className="bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] bg-clip-text text-transparent text-xl 3xl:!text-2xl font-medium capitalize mb-4">
                {interviewData?.interview?.[0]?.title}
              </div>
              {interviewData?.company?.logo ? (
                <Image
                  alt=""
                  src={interviewData?.company_logo}
                  width={80}
                  height={60}
                  className="object-contain mb-3"
                  onError={() => {
                    setInterviewData((prev: typeof interviewData) => ({
                      ...prev,
                      company: {
                        ...prev.company,
                        logo: "/interviews/fig-links-logo.svg",
                      },
                    }));
                  }}
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
            <CardContent className="p-0 mt-6">
              <form className="flex flex-col">
                <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1 max-[767px]:gap-y-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs 3xl:!text-sm font-medium text-[#383838] capitalize">
                      First Name<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="w-full bg-[#bb44e80f] text-black text-sm 3xl:!text-base font-normal rounded-md shadow-none border border-[#e7ddea] h-10 max-[767px]:h-8 focus-visible:ring-0"
                      placeholder="Enter First Name"
                      name="fname"
                      value={candidateDetails?.fname ?? ""}
                      onChange={onTextFieldChange}
                    />
                    <ErrorMessages errorMessages={errors} keyname="fname" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs 3xl:!text-sm font-medium text-[#383838] capitalize">
                      Last Name<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="w-full bg-[#bb44e80f] text-sm 3xl:!text-base font-normal rounded-md shadow-none border border-[#e7ddea] h-10 max-[767px]:h-8 focus-visible:ring-0"
                      placeholder="Enter Last Name"
                      name="lname"
                      value={candidateDetails?.lname ?? ""}
                      onChange={onTextFieldChange}
                    />
                    <ErrorMessages errorMessages={errors} keyname="lname" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs 3xl:!text-sm font-medium text-[#383838] capitalize">
                      Email<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="w-full bg-[#bb44e80f] text-sm 3xl:!text-base font-normal rounded-md max-[767px]:h-8 shadow-none border border-[#e7ddea] h-10 focus-visible:ring-0"
                      placeholder="Enter Email"
                      name="email"
                      value={candidateDetails?.email ?? ""}
                      onChange={onTextFieldChange}
                    />
                    <ErrorMessages errorMessages={errors} keyname="email" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs 3xl:!text-sm font-medium text-[#383838] capitalize">
                      Mobile No.
                    </Label>
                    <Input
                      className="w-full bg-[#bb44e80f] text-sm 3xl:!text-base font-normal rounded-md max-[767px]:h-8 shadow-none border border-[#e7ddea] h-10 focus-visible:ring-0"
                      placeholder="Enter Mobile No."
                      type="number"
                      name="phone"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={candidateDetails?.phone ?? ""}
                      onChange={onTextFieldChange}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-10">
                  <Button
                    className="min-w-45 py-2 max-[767px]:px-12 rounded-md bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] text-white text-base 3xl:!text-lg font-medium capitalize shadow-[0_0_24px_rgba(153,23,255,0.1),0_0_1px_4px_rgba(255,255,255,0.1)] cursor-pointer"
                    onClick={onSubmit}
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <div className="flex items-center justify-center">
                        <LoaderCircle className="text-white animate-spin" />
                      </div>
                    ) : (
                      <>
                        Submit
                        <AutoAwesomeIcon className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="p-2 mt-6 flex items-center justify-center">
              <p className="text-xs 3xl:!text-sm font-normal text-[#00000099] text-center leading-tight">
                By clicking “Submit” I agree to FigLinks
                <span className="underline"> Terms of Use</span>,
                <span className="underline"> Privacy Policy</span>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default CandidateForm;