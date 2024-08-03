"use client";
import React, { useRef, useState } from "react";
import Footer from "@/components/Footer/Footer";
import SimpleCarousel from "@/components/SimpleCarousel/SimpleCarousel";
import Image from "next/image";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// import required modules
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import { FaCircleArrowDown } from "react-icons/fa6";

function page() {
  const events = [
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA0925.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Andrew_Okyere/_MG_1028-Enhanced-NR.jpg",
      photographer: "Andrew Okyere",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA1149.jpg",
      photographer: "Jade Chongsathapornpong",
    },

    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA2926.jpg",
      photographer: "Jade Chongsathapornpong",
    },

    {
      src: "/images/other_images/Sebastian_Ochoa/000045080009.jpg",
      photographer: "Sebastian Ochoa",
    },

    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA4087.jpg",
      photographer: "Jade Chongsathapornpong",
    },

    {
      src: "/images/other_images/Ruhundaka_Ejilemele/DSC_4286.jpg",
      photographer: "Ruhundaka Ejilemele",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA4600.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Andrew_Okyere/_MG_0677.jpg",
      photographer: "Andrew Okyere",
    },

    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA7811.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA9725.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Daniel_Jang/AeroAstro-5.jpg",
      photographer: "Daniel Jang",
    },
    {
      src: "/images/other_images/Marcelo_Maza/MJM-21.jpg",
      photographer: "Marcelo Maza",
    },
    {
      src: "/images/other_images/Ruhundaka_Ejilemele/IMG_7711-2.jpg",
      photographer: "Ruhundaka Ejilemele",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA7594.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Sebastian_Ochoa/Y16333009673-R1-043-20.jpg",
      photographer: "Sebastian Ochoa",
    },

    {
      src: "/images/other_images/Andrew_Okyere/_MG_8744.jpg",
      photographer: "Andrew Okyere",
    },
    {
      src: "/images/other_images/Ruhundaka_Ejilemele/DSC_5089.jpg",
      photographer: "Ruhundaka Ejilemele",
    },
    {
      src: "/images/other_images/Alison_Soong/20240915-P1050430.jpg",
      photographer: "Alison Soong",
    },

    {
      src: "/images/other_images/Ruhundaka_Ejilemele/DSC_4444.jpg",
      photographer: "Ruhundaka Ejilemele",
    },

    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA3208.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA2389.jpg",
      photographer: "Jade Chongsathapornpong",
    },
  ];
  const niceThings = [
    {
      src: "/images/other_images/Ruhundaka_Ejilemele/DSC_6569.jpg",
      photographer: "Ruhundaka Ejilemele",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA2438.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA3772.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Alison_Soong/20140118-_TNQ0052.jpg",
      photographer: "Alison Soong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA5489.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/IMG_4075.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Ruhundaka_Ejilemele/DSC_7784.jpg",
      photographer: "Ruhundaka Ejilemele",
    },
  ];

  function handleScroll() {
    const target = document.getElementById("section2");

    target?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <div className="min-h-[90vh]    relative bg-white lg:pt-[5vh] pt-[10vh]">
        {/* <main className="w-full flex flex-col justify-start items-center h-[100vh] bg-white "> */}
          <div className="h-full  w-full  bg-white  lg:rounded-t-xl flex flex-col items-center">
            <SimpleCarousel
              images={events}
              id="carousel1"
              reverseDirection={false}
            />
            <SimpleCarousel
              images={niceThings}
              id="carousel2"
              reverseDirection={true}
            />
            {/* <section
              className="h-[100vh] w-full flex flex-col justify-center items-center  pb-[1%]"
              id="section1"
            >
              <div className="w-full  py-[2%] flex flex-col items-center justify-center">
                <div className="w-full flex  flex-col justify-center items-center ">
                  <FaCircleArrowDown
                    style={{
                      width: "auto",
                      height: "3.5rem",
                      cursor: "pointer",
                      color: "white",
                    }}
                    to="section2"
                    onClick={handleScroll}
                  />
                </div>
              </div>
            </section>
            <section
              className="h-[100vh] w-full flex flex-col justify-center items-center relative"
              id="section2"
            >
              <div className="w-full  py-[2%] flex flex-col items-center justify-center"></div>
            </section> */}
          </div>
        {/* </main> */}
      </div>
      <Footer />
    </>
  );
}

export default page;
