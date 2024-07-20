import React from "react";
import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar_and_Sidebar/Navbar";
import Image from "next/image";
import Link from "next/link";

function page() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white flex flex-col pt-[15vh] text-black">
        <main className="w-full h-full px-12 md:px-40 flex flex-col space-y-20">
          <div className="flex flex-col justify-center w-full items-center space-y-3 px-12 md:px-60">
            <p className=" text-center ">HEY THERE</p>
            <p className="text-5xl font-extralight w-full text-center ">
              We would love to hear from you!
            </p>
            <p className=" text-center text-black font-[250]">
              Feel free to send us a message or find us in the office.
            </p>
          </div>
          <div className="relative w-full flex justify-between ">
            <div className=" flex flex-col items-center w-1/2 pt-5 space-y-3">
              <div className="flex flex-col space-y-1 items-center">
                <h className=" text-lg font-[400]"> WANT TO GET IN TOUCH?</h>
                <Link
                  href="mailto:technique@mit.edu"
                  className="text-blue-400 font-[300]"
                >
                  Email us!
                </Link>
              </div>
              <div className="flex flex-col items-center  space-y-1 text-gray-500">
                <h className=" text-base "> VISIT US IN PERSON</h>
                <div className="flex flex-col items-center font-[250] text-sm">
                  <p>142 Memorial Dr.</p>
                  <p>Walker Memorial</p>
                  <p>50-320</p>
                </div>
              </div>
              <div className="flex flex-col items-center  space-y-1 text-gray-500">
                <h className=" text-base "> MAILING ADDRESS</h>
                <div className="flex flex-col items-center font-[250] text-sm">
                  <p>MIT Technique</p>
                  <p>32 Vassar Street</p>
                  <p>Cambridge, Ma, 02139</p>
                  <p>50-320</p>
                </div>
              </div>
            </div>
            <div className="w-1/2">
              <Image
                src="/images/other_images/Jade_Chongsathapornpong/DSC02130.jpg"
                alt=""
                width={2000}
                height={2000}
                priority
              />
              <p
                className="absolute bottom-[1%] right-[2%] text-white"
                style={{ fontSize: "3%" }}
              >
                Photo Credits: Jade Chongsathapornpong
              </p>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default page;
