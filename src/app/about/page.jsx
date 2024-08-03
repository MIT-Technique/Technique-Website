"use client";
import React from "react";
import Link from "next/link";
import Footer from "@/components/Footer/Footer";

function page() {
  return (
    <>
      <div className="min-h-screen  bg-white lg:pt-[5vh] pt-[10vh] font-light text-gray-700 flex flex-col ">
        <main className="w-full px-12 md:px-48 pb-6 flex flex-col">
          <div>
            <div className="flex flex-col justify-center w-full items-center space-y-3 ">
              <p className="text-5xl font-extralight w-full text-center text-black">
                About Us
              </p>
              <div>
                <div className=" text-center ">
                  Since 1885, our staph have crafted a beautiful annual of
                  photographs and prose commemorating
                </div>
                <div className=" text-center ">each year at MIT.</div>
              </div>
            </div>
            <div className="flex flex-col mt-8 space-y-5">
              <p className="text-center">
                We are MIT&apos;s photography, yearbook, and design student
                organization. Every year, our staph send off our 400 page annual
                to the publisher in February and release the book in May every
                year. As students and alumni of MIT, we take great care to
                showcase MIT in its truest form, candidly, at its best and at
                its worst. We know how tough the Institute can be, and we know
                how rewarding it is to get to the other side.
              </p>
              <p className="text-center">
                In addition to designing the MIT yearbook, Technique supports
                the campus photography community by providing equipment rentals,
                event photography services, and studio space for students. We
                manage a photo studio and darkroom in the Stratton Student
                Center for convenient access.
              </p>
            </div>
          </div>
          <div className="flex flex-col xl:flex-row xl:space-x-4">
            <div className="mt-4 space-y-3 bg-[#265147] rounded-lg text-white p-3 px-5 w-full xl:w-1/3">
              <p className="text-3xl font-extralight  w-full text-center">
                H.R.H. Grogo
              </p>
              <div className="space-y-2">
                <p>
                  If you hang around Technique often, you&apos;ll hear this name
                  being tossed around. You&apos;ll also see his beautiful face
                  on all our merch. THis is because our mascot is a gorilla and
                  his name is H.R.H. Grogo
                </p>
                <p>
                  &quot;But why?&quot; you asl. We don&apos;t know either, but
                  H.R.H. Grogo has been there since the beginning, inscribed in
                  the back of the very first <i>Technique </i>, and has been
                  there ever since. We&apos;re not quite sure how or when he
                  became a gorilla.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3 bg-[#FF581c]  rounded-lg p-3 px-5 w-full xl:w-1/3">
              <p className="text-3xl font-extralight  w-full text-center text-white">Weekly</p>
              <div className="space-y-2 text-white">
                <p>
                  We hold regular meetings at 3pm on Saturday in the riverside
                  lounge of Walker Memorial. Anyone is welcome to attend. We
                  have photographic equipment for borrowing and often teach
                  various photography and design related seminars at this time.
                </p>
                <p>
                  During book season, fall term through early spring term, we
                  hold regular meetings during the week where the various
                  editors of each <i>Technique</i> section come in and do work.
                  This is the best time to get involved with the processof
                  crafting a yearbook
                </p>
                <p>
                  We also Enjoy going on photwalks and different photographic
                  excursions from time to time!
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3 bg-[#265147] rounded-lg text-white p-3 px-5 w-full xl:w-1/3">
              <p className="text-3xl font-extralight  w-full text-center">Staph</p>
              <div className="space-y-2">
                <p>
                  Many of our staph are part time (or full time) photographers
                  and/or designers, as well as MIT students and alumni. Most of
                  our staph are free of infection.
                </p>
                <p>
                  It takes no experience to join Technique . Our dedicated staph
                  are committed to helping everyone who&apos;s willing to learn,
                  especially if when it&apos;s about photography or design.
                </p>
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
