"use client";
import React, { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar_and_Sidebar/Navbar";
import Image from "next/image";

function page() {
  const container = useRef();
  const screen = useRef();
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(300);
  const [divider, setDivider] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setWidth(width);
      }
    });
    resizeObserver.observe(container.current);
    const resizeObserver2 = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setHeight(height / 3);
        if (width < 640) {
          setDivider(1);
        } else if (width < 768) {
          setDivider(2);
        } else {
          setDivider(3);
        }
      }
    });
    resizeObserver2.observe(screen.current);

    return () => {
      resizeObserver.unobserve(container.current);
      resizeObserver.disconnect();
      resizeObserver2.unobserve(container.current);
      resizeObserver2.disconnect();
    };
  }, []);

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen  bg-white pt-[15vh] font-light text-gray-700 flex flex-col"
        ref={screen}
      >
        <main className="w-full  pb-6">
          <div className="flex flex-col justify-center w-full items-center space-y-3 px-12 md:px-60">
            <p className="text-5xl font-extralight w-full text-center text-black">
              Hire Us
            </p>
            <p className=" text-center ">
              If you need photography for an event, our community of MIT
              photographers can help.
            </p>
          </div>
          <div className="flex mt-8  w-full bg-black relative" ref={container}>
            <div
              className="relative hidden md:block bg-black"
              style={{ minHeight: isLoading ? height || "300px" : "0px" }}
            >
              <Image
                src="/images/other_images/Alison_Soong/20240915-P1050432.jpg"
                alt=""
                width={width / divider}
                height={height}
                onLoad={() => setIsLoading(false)}
                className="relative z-30"
              />
              <p
                className="absolute bottom-[1%] right-[2%] text-white"
                style={{ fontSize: "3%" }}
              >
                Photo Credits: Alison Soong
              </p>
            </div>
            <div
              className="relative bg-black"
              style={{ minHeight: isLoading ? height || "300px" : "0px" }}
            >
              <Image
                src="/images/other_images/Jade_Chongsathapornpong/_TNA2320.jpg"
                alt=""
                width={width / divider}
                height={height}
                priority
                onLoad={() => setIsLoading(false)}
              />
              <p
                className="absolute bottom-[1%] right-[2%] text-white"
                style={{ fontSize: "3%" }}
              >
                Photo Credits: Jade Chongsathapornpong
              </p>
            </div>
            <div
              className="relative hidden sm:block bg-black"
              style={{ minHeight: isLoading ? height || "300px" : "0px" }}
            >
              <Image
                src="/images/other_images/Jade_Chongsathapornpong/_TNA3975C.jpg"
                alt=""
                width={width / divider}
                height={height}
                priority
                onLoad={() => setIsLoading(false)}
              />
              <p
                className="absolute bottom-[1%] right-[2%] text-white"
                style={{ fontSize: "3%" }}
              >
                Photo Credits: Jade Chongsathapornpong
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 px-12 md:px-60">
            <div className="space-y-2">
              <p>
                We offer event photography services for all organizations and
                groups affiliated with MIT. Technique matches you with one of
                our trained staff photographers to capture every moment during
                your event. To get a quote, please{" "}
                <Link href="mailto:technique@mit.edu?subject=Event%20Photography%20Quote" className="text-blue-400">
                  email us
                </Link>{" "}
                with the subject line &quot;Event Photography Quote&quot; and
                more details about your event.
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
