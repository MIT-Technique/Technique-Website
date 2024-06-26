"use client";
import React from "react";
import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar_and_Sidebar/Navbar";
import Image from "next/image";

function page() {
  return (
    <>
      <Navbar/>
      <div className="min-h-screen h-screen bg-white">
        <main className="flex flex-col md:flex-row relative items-center w-full h-full px-10 py-24 md:py-12 md:px-40 font-light text-gray-700">
          <div className="relative aspect-square w-auto h-full mx-8">
            <Image
              src="/images/other_images/Jade_Chongsathapornpong/20240421_152409.jpg"
              alt="senior picture"
              fill={true}
              style={{
                borderRadius: "0.3rem",
                objectFit: "contain",
              }}
            />
          </div>
          <div className="space-y-3 w-fit">
            <h1 className="text-3xl font-extralight text-black">WEEKLY</h1>
            <div className="space-y-2">
              <p>
                We hold regular meetings at 3pm on Saturday in the riverside
                lounge of Walker Memorial. Anyone is welcome to attend. We have
                photographic equipment for borrowing and often teach various
                photography and design related seminars at this time.
              </p>
              <p>
                During book season, fall term through early spring term, we hold
                regular meetings during the week where the various editors of
                each <i>Technique</i> section come in and do work. This is the
                best time to get involved with the processof crafting a yearbook
              </p>
              <p>
                We also Enjoy going on photwalks and different photographic
                excursions from time to time!
              </p>
            </div>
          </div>
        </main>
      </div>
      <Footer/>
    </>
  );
}

export default page;
