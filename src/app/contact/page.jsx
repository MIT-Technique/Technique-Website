import React from "react";
import Footer from "../../components/Footer/Footer";
import Image from "next/image";
import Link from "next/link";

function page() {
  return (
    <>
      <div className="min-h-[90vh] flex flex-col lg:pt-[5vh] pt-[10vh] text-black">
        <main className="w-full h-full px-4 flex flex-col space-y-20">
          <div className="relative w-[100%] flex flex-col sm:flex-col  lg:space-y-0  h-full pb-2">
            <div className="relative w-[100%] lg:w-[100%] h-[45vh] sm:h-[80vh] lg:h-[83vh] mb-3">
              <Image
                src="/images/club_photo/DSC_0815-3.jpg"
                alt="Contact Image showing Technique's Managing Board 2023-2024"
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
                Photo Credits: MIT Technique
              </p>
            </div>
            <div className="text-center w-[100%] h-[60vh] xs:h-[50vh] sm:h-[55vh] lg:h-[60vh] bg-[#043b28] rounded-2xl py-4 flex flex-row lg:flex-col justify-center items-center text-white m-0">
              <div className="w-1/2 flex flex-col align-center justify-center">
                <div className="flex flex-col space-y-1 items-center pb-3">
                  <h1 className=" text-lg font-[400] ">
                    {" "}
                    WANT TO GET IN TOUCH?
                  </h1>
                  <a href="mailto:technique@mit.edu" className="text-blue-400">
                    Email us!
                  </a>
                </div>
                <div className="flex flex-col items-center space-y-1 pb-4">
                  <h className=" text-base "> VISIT US IN PERSON</h>
                  <div className="flex flex-col items-center font-[250] text-sm">
                    <p className="pb-1">142 Memorial Dr.</p>
                    <p className="pb-1">Walker Memorial</p>
                    <p className="pb-1">50-320</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-1 w-1/2">
                <h className=" text-base "> MAILING ADDRESS</h>
                <div className="flex flex-col items-center font-[250] text-sm">
                  <p className="pb-1">MIT Technique</p>
                  <p className="pb-1">32 Vassar Street</p>
                  <p className="pb-1">Cambridge, Ma, 02139</p>
                  <p className="pb-1">50-320</p>
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
