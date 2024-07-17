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
              If you need photography for an event, our community of MIT
              photographers can help.
            </p>
          </div>
          <div className="relative w-full flex justify-between ">
            <div className=" flex flex-col items-center w-1/2">
              <div className="flex flex-col space-y-2 items-center">
                <h className=" text-xl"> WANT TO GET IN TOUCH?</h>
                <Link
                  href="mailto:technique@mit.edu"
                  className="text-blue-400 font-[300]"
                >
                  Email us!
                </Link>
              </div>
              <br></br>
              <div className="flex flex-col items-center  space-y-2 text-gray-500">
                <h className=" text-xl "> VISIT US IN PERSON</h>
                <div className="flex flex-col items-center font-[250]">
                  <p>142 Memorial Dr.</p>
                  <p>Walker Memorial</p>
                  <p>50-320</p>
                </div>
              </div>
            </div>
            <div className="w-1/2">
              <Image
                src="/images/other_images/Jade_Chongsathapornpong/DSC02130.jpg"
                alt=""
                width={600}
                height={600}
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
