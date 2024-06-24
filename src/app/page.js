"use client";
import Image from "next/image";
import Footer from "@/components/Footer/Footer";
import React, { useState, useEffect } from "react";
import { ReactTyped } from "react-typed";
import { FaCircleArrowDown } from "react-icons/fa6";
import { IoArrowDownCircleSharp } from "react-icons/io5";
import Navbar from "@/components/Navbar_and_Sidebar/Navbar";
// import { Button } from "@chakra-ui/react";
import { Button } from "@mui/material";

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
    <div className="relative h-fit">
      <Navbar/>

      <div className=" h-[100vh] flex flex-col">
        <section
          className="h-fit  bg-white flex flex-col justify-center items-center"
          id="section1"
        >
          <div className=" w-full relative h-[100vh]">
            <Image
              src="/images/other_images/Jade_Chongsathapornpong/TNA9296_01.jpg"
              alt="cover picture"
              fill={true}
              style={{ objectFit: "cover", position: "absolute", zIndex: 1 }}
            ></Image>
            <p className="absolute bottom-[6%] right-[3%] text-gray-300 z-10 text-right text-xs">
              photo credit:
              <br></br>
              <br></br>
              Jade Chongsathapornpong | Technique 2024 Co-Editor-in-Chief
            </p>
            <div className="flex flex-col justify-center h-full w-full relative z-20 space-y-3">
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
              <div className="w-full flex justify-center cursor-pointer">
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
          <div
            className="flex flex-col items-center justify-center min-h-screen h-screen w-full bg-white relative space-y-[2%] pt-[15vh]"
            id="section2"
          >
            {/* <div className="h-full w-[15%] absolute left-0 bg-black top-0 hidden lg:block">

            </div> */}
            <div className="relative rounded-[0.3rem] h-[57.6%] w-[86.4%] md:h-[69.12%] md:w-[75%] overflow-hidden">
              <Image
                src="/images/Senior_Pictures/232198679.JPG"
                alt="senior picture"
                layout="fill"
                style={{
                  borderRadius: "0.3rem",
                  objectFit: "contain",
                }}
              />
            </div>
            <div className="flex flex-col space-y-[1%] items-center text-center">
              <div className="text-black text-3xl">
                MIT&apos;s fourth-year students are the star of the show.
              </div>
              <p className="text-black text-semibold text-xs">
                Portrait sessions are for seniors only and occur in the fall of
                your fourth-year.
              </p>
              <Button
                variant="outlined"
                sx={{
                  width: "15vw",
                  borderColor: "black",
                  color: "black",
                  "&:hover": {
                    borderColor: "black",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
                color="primary"
              >
                {" "}
                Click Me
              </Button>
             
            </div>
          {/* <div className="h-[100%]] w-[15%] absolute right-0 bg-black top-[-5%] hidden lg:block">
          </div> */}
  
          </div>
          {/* <div className="bg-black w-full h-[20vh] text-white relative z-50">
            asdf
          </div> */}
          <Footer/>
        </section>
        {/* <section className="flex flex-col items-center justify-center min-h-screen h-screen w-screen bg-blue-400">
          <div className="text-white">
            MIT&apos;s fourth-year students are the star of the show.
          </div>
        </section> */}
      </div>
    </div>
  );
}
