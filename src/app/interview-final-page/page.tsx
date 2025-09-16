import Image from "next/image";

const InterviewFinalPage = () => {
    return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center px-5 box-border bg-[#efefef] ">
      <Image
        src="/interviews/fig-links.svg"
        alt="logo"
        width={400}
        height={300}
        className="w-[150px] h-[150px] md:w-[300px] md:h-[300px] sm:w-[300px] sm:h-[300px]"
      />
      <p className="text-2xl font-semibold text-gray-800 sm:text-2xl">
        Thank you for your feedback
      </p>
    </div>
  );
};

export default InterviewFinalPage;
