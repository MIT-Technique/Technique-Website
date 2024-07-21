"use client";
import React, { useEffect } from "react";
import Slider from "react-slick";
import SimpleCarouselCSS from "./SimpleCarousel.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// import required modules
import { Autoplay, Pagination, Navigation } from "swiper/modules";

function SimpleCarousel({ images, reverseDirection }) {
  var settings = {
    dots: true,
    infinite: true,
    // speed: 500,
    slidesToScroll: 1,
    arrows: true,
    variablWidth: true,
    slidesToShow: 3,
    adaptiveHeight: true,
    // lazyLoad: true,
    centerMode: true,
    // centerPadding: "70px",
    autoplay: { reverseDirection: false, pauseOnMouseEnter: true },
    speed: 2000,
    autoplaySpeed: 2000,
    // reverseDirection: true,
  };
  useEffect(()=>{

  },[])
  return (
    // <div className="w-[95vw]">
    //   <Slider {...settings}>
    //     {images.map(({ src }, key) => {
    //       return (
    //         <div key={key} className="text-black  relative overflow-hidden h-[30vh] bg-red-400 ">
    //           {/* <div className="overflow-hidden  relative "> */}
    //             {/* <div className=" w-full "> */}
    //               <Image
    //                 className="rounded-3xl"
    //                 src={src}
    //                 alt=""
    //                 fill={true}
    //                 style={{  borderRadius: "1rem", objectFit: "cover",}}
    //               ></Image>
    //             {/* </div> */}
    //           {/* </div> */}
    //           {/* <h3> {key} 1</h3> */}
    //         </div>
    //       );
    //     })}
    //   </Slider>
    // </div>
    <div className="w-[95vw] h-[50vh] flex justify-center items-center overflow-x-hidden bg-transparent">
      <Swiper
        slidesPerView={1}
        loop={true}
        speed={2000}
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
          reverseDirection: reverseDirection,
        }}
        pagination={{
          clickable: true,
        }}
        lazy="true"
        navigation={true}
        modules={[Autoplay, Navigation]}
        className="w-[99.7%] h-[37vh]"
        breakpoints={{
          640: { slidesPerView: 2 },
          1000: { slidesPerView: 3 },
          "@0.7": {
            slidesPerView: 2,
          },
        }}
        style={{
          "--swiper-navigation-color": "#fff",
          "--swiper-pagination-color": "#fff",
        }}
      >
        {images.map(({ src, photographer }, key) => {
          return (
            <SwiperSlide
              key={key}
              className="text-black  relative bg-white rounded-2xl"
            >
              <Image
                className="rounded-3xl relative"
                src={src}
                alt=""
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                style={{ borderRadius: "1rem", objectFit: "cover" }}
              ></Image>
              <p
                className="absolute bottom-[1%] right-[2%] text-white"
                style={{ fontSize: "3%" }}
              >
                Photo Credits: {photographer}
              </p>
              <div className="swiper-lazy-preloader swiper-lazy-preloader-black"></div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

export default SimpleCarousel;
