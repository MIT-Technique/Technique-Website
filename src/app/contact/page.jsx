import React from "react";
import Footer from "@/components/Footer/Footer";
import Image from "next/image";
import Link from "next/link";

function page() {
  return (
    <>
      <div className="min-h-[90vh] flex flex-col lg:pt-[5vh] pt-[10vh] text-black">
        <main className="w-full h-full px-4 flex flex-col space-y-20">

          <div className="relative w-full flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3 h-full pb-5">

            <div className="relative w-[100%] lg:w-2/3 h-[45vh] lg:h-[83vh]">
              <Image
                src="/images/other_images/Jade_Chongsathapornpong/DSC02130.jpg"
                alt=""
                priority
                quality={100}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                style={{ borderRadius: "1rem", objectFit: "cover" }}
              />
              <p
                className="absolute bottom-[1%] right-[2%] text-white"
                style={{ fontSize: "3%" }}
              >
                Photo Credits: Jade Chongsathapornpong
              </p>
            </div>
            <div className="w-[100%] lg:w-1/3 h-fit lg:h-[83vh] bg-[#043b28] rounded-2xl py-4 flex-col justify-center items-center text-white">
              <div className="flex flex-col space-y-1 items-center">
                <h className=" text-lg font-[400]"> WANT TO GET IN TOUCH?</h>
                <a
                  href="mailto:technique@mit.edu"
                  className="text-blue-400"
                >
                  Email us!
                </a>
              </div>
              <div className="flex flex-col items-center space-y-1 ">
                <h className=" text-base "> VISIT US IN PERSON</h>
                <div className="flex flex-col items-center font-[250] text-sm">
                  <p>142 Memorial Dr.</p>
                  <p>Walker Memorial</p>
                  <p>50-320</p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-1 ">
                <h className=" text-base "> MAILING ADDRESS</h>
                <div className="flex flex-col items-center font-[250] text-sm">
                  <p>MIT Technique</p>
                  <p>32 Vassar Street</p>
                  <p>Cambridge, Ma, 02139</p>
                  <p>50-320</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default page;
