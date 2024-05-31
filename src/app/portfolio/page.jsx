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
    <div className="min-h-screen h-fit w-screen bg-white  pt-[15vh]">
      <main className="w-full h-full flex flex-col justify-center items-center">
        <section
          className="h-[100vh] w-full flex flex-col justify-center items-center  pb-[1%]"
          id="section1"
        >
          <label
            htmlFor="carousel1"
            className="w-[95vw] text-left pl-[0.5%] font-semibold text-2xl mb-[1%]"
          >
            {" "}
            EVENTS
          </label>
          <SimpleCarousel images={events} id="carousel1" />
          <div className="w-full flex  flex-col justify-center items-center">
            <FaCircleArrowDown
              style={{ width: "auto", height: "3.5rem" , cursor: "pointer"}}
              to="section2"
              onClick={handleScroll}
            />
            <p className="font-semibold">Go to Pretty</p>
          </div>
        </section>
        <section
          className="h-[100vh] w-full flex flex-col justify-center items-center "
          id="section2"
        >
          <label
            htmlFor="carousel2"
            className="w-[95vw] text-left pl-[0.5%] font-semibold text-2xl mb-[1%]"
          >
            {" "}
            PRETTY PICTURES!
          </label>
          <SimpleCarousel images={niceThings} id="carousel2"/>
        </section>
      </main>
    </div>
  );
}

export default page;
