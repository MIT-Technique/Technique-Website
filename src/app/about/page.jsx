"use client";
import React from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

function page() {
  return (
    <div className="min-h-screen h-fit w-screen bg-white pt-[15vh] font-light text-gray-700 flex-col">
      <main className="w-full px-60 pb-6">
        <div className="flex-col justify-center w-full items-center space-y-3 ">
          <p className="text-5xl font-extralight w-full text-center text-black">
            ABOUT US
          </p>
          <div>
            <div className=" text-center ">
              Since 1885, our staph have crafted a beautiful annual of
              photographs and prose commemorating
            </div>
            <div className=" text-center ">each year at MIT.</div>
          </div>
        </div>
        <div className="flex-col mt-8 space-y-5">
          <p className="text-center">
            We are MIT's photography, yearbook, and design student organization.
            Every year, our staph send off our 400 page annual to the publisher
            in February and release the book in May every year. As students and
            alumni of MIT, we take great care to showcase MIT in its truest
            form, candidly, at its best and at its worst. We know how tough the
            Institute can be, and we know how rewarding it is to get to the
            other side.
          </p>
          <p className="text-center">
            In addition to designing the MIT yearbook, Technique supports the
            campus photography community by providing equipment rentals, event
            photography services, and studio space for students. We manage a
            photo studio and darkroom in the Stratton Student Center for
            convenient access.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-3xl font-extralight text-black">H.R.H. Grogo</p>
          <div className="space-y-2">
            <p>
              If you hang around Technique often, you'll hear this name being
              tossed around. You'll also see his beautiful face on all our
              merch. THis is because our mascot is a gorilla and his name is
              H.R.H. Grogo
            </p>
            <p>
              "But why?" you asl. We don't know either, but H.R.H. Grogo has
              been there since the beginning, inscribed in the back of the very
              first <i>Technique </i>, and has been there ever since. We're not
              quite sure how or when he became a gorilla.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <p className="text-3xl font-extralight text-black">Staph</p>
          <div className="space-y-2">
            <p>
              Many of our staph are part time (or full time) photographers
              and/or designers, as well as MIT students and alumni. Most of our
              staph are free of infection.
            </p>
            <p>
              It takes no experience to{" "}
              <Link href="/join" className=" text-[#156fff]">
                join Technique
              </Link>
              . Our dedicated staph are committed to helping everyone who's
              willing to learn, especially if when it's about photography or
              design.
            </p>
          </div>
        </div>
      </main>
      <Footer></Footer>
    </div>
  );
}

export default page;
