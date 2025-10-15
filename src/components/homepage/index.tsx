import React from 'react';
import Image from "next/image";


const HomeComponent = () => {
 return (
    <div
      className="min-h-screen bg-cover bg-no-repeat bg-top bg-fixed"
      style={{ backgroundImage: "url(/home/loginpage@3x.png)" }}
    >
      <main className="w-[90%] mx-auto pt-8">
        <Image alt="" src="/home/logo3.svg" width={230} height={50} />
        <div className="grid grid-cols-[80%_20%] items-center min-h-[calc(100vh-120px)] px-0 pl-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-[85%] ml-auto">
              <div className="flex flex-col items-center gap-4">
                <h1 className="text-[25px] 3xl:!text-[32px] font-normal bg-gradient-to-r from-[#430ca6] via-[#a533cf] to-[#ec6d78] bg-clip-text text-transparent relative leading-[1.2]">
                  Bringing harmony to your
                  <br /> recruitment process.
                  <Image
                    alt=""
                    src="/home/vector.svg"
                    width={16}
                    height={10}
                    className="absolute top-10 right-0 object-contain z-10"
                  />
                </h1>
                <div className="w-[38.225rem] h-[3.938rem] overflow-hidden text-lg 3xl:!text-xl">
                  <div className="flex items-start justify-start">
                    <div className="flex items-center justify-center px-[3rem] py-5">
                      <div className="opacity-80 leading-[130%]">
                        <span className="font-medium text-[#e2636e]">
                          Omega Healthcare{" "}
                        </span>
                        <span>onboarded </span>
                        <span className="font-medium text-[#ec6d78]">
                          5000{" "}
                        </span>
                        <span>new hires in two months</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Image
                  alt=""
                  src="/home/lines.svg"
                  width={56}
                  height={56}
                  className="absolute top-37 right-115 object-contain z-10"
                />
              </div>
              <div className="w-[50%] mx-auto mt-4">
                <object
                  type="image/svg+xml"
                  data="/home/Login_Animation.svg"
                  aria-label="login animation"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeComponent;