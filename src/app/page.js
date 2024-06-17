"use client";
import Image from "next/image";
import Footer from "@/components/Footer/Footer";
import React, { useState, useEffect } from "react";
import { ReactTyped } from "react-typed";
import { FaCircleArrowDown } from "react-icons/fa6";
import { IoArrowDownCircleSharp } from "react-icons/io5";

export default function Home() {
  const [tnq, setTnq] = useState("");
  const options = {
    strings: [
      "Photographers.",
      "Photojournalists.",
      "Designers.",
      "Editors.",
      "Yearbook.",
    ],
    loop: true,
    typeSpeed: 100,
    backDelay: 2000,
    backspeed: 50,
    showCursor: true,
    smartBackspace: false,
  };

  function handleScroll() {
    const target = document.getElementById("section2");

    target?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="w-screen h-screen flex flex-col ">
      <section
        className="min-h-screen h-screen w-screen bg-white flex flex-col justify-center items-center"
        id="section1"
      >
        <div className=" w-screen relative h-full">
          <Image
            src="/images/other_images/Jade_Chongsathapornpong/TNA9296_01.jpg"
            alt="cover picture"
            fill={true}
            style={{ objectFit: "cover", position: "absolute", zIndex: 1 }}
          ></Image>
          <div className="flex flex-col justify-center h-full w-full absolute z-20 space-y-3">
            <div className="w-full flex flex-col items-center justify-center">
              <p className=" text-center  text-white">We are MIT&apos;s</p>
              <div className="w-full flex justify-center">
                <ReactTyped
                  strings={options.strings}
                  loop={options.loop}
                  typeSpeed={options.typeSpeed}
                  backDelay={options.backDelay}
                  backSpeed={options.backspeed}
                  showCursor={options.showCursor}
                  smartBackspace={options.smartBackspace}
                  style={{
                    fontSize: "2.25rem",
                    lineHeight: "2.5rem",
                    fontWeight: "300",
                    background: "white",
                    color: "white",
                    background: "transparent",
                  }}
                ></ReactTyped>
              </div>
            </div>
            <div className="w-full flex justify-center">
              <FaCircleArrowDown
                style={{
                  width: "auto",
                  height: "3.5rem",
                  color: "white",
                }}
                to="section2"
                onClick={handleScroll}
              />
              
            </div>
          </div>
        </div>
      </section>

      <section
        className="flexflex-col items-center justify-between min-h-screen h-screen w-screen bg-blue-400"
        id="section2"
      >
        <div className="w-screen h-screen bg-red-300"></div>
      </section>
    </div>
  );
}
