"use client";
import React from "react";
import Footer from "@/components/Footer";

function page() {
  return (
    <div className="w-screen min-h-screen h-fit bg-white">
      <main className="w-full h-full pt-[15vh] px-60 font-light text-gray-700  ">
        <div className="mt-4 space-y-3 w-fit">
          <p className="text-3xl font-extralight text-black">WEEKLY</p>
          <div className="space-y-2">
            <p>
              We hold regular meetings at 3pm on Saturday in the riverside
              lounge of Walker Memorial. Anyone is welcome to attend. We have
              photographic equipment for borrowing and often teach various
              photography and design related seminars at this time.
            </p>
            <p>
              During book season, fall term through early spring term, we hold
              regular meetings during the week where the various editors of each{" "}
              <i>Technique</i> section come in and do work. This is the best
              time to get involved with the processof crafting a yearbook
            </p>
            <p>
              We also Enjoy going on photwalks and different photographic
              excursions from time to time!
            </p>
          </div>
        </div>
      </main>
      <Footer></Footer>
    </div>
  );
}

export default page;
