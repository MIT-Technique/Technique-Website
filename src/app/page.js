"use client";
import Image from "next/image";
import Footer from "@/components/Footer/Footer";
import React from "react";
export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section - Full viewport, starts from top (behind transparent nav) */}
      <section className="relative h-screen" id="section1">
        {/* Hero Image */}
        <Image
          src="/images/other_images/Ruhundaka_Ejilemele/ruejilem-HRH-6941.jpg"
          alt="MIT Technique Photography"
          fill={true}
          sizes="100vw"
          priority
          style={{ objectFit: "cover" }}
        />

        {/* Gradient Overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30 z-10" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-end items-center pb-32 lg:pb-40 z-20">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-4">
            {"MIT's Photography & Yearbook"}
          </p>
          <h1 className="text-4xl lg:text-6xl font-light text-white text-center tracking-tight">
            {"Technique"}
          </h1>
          <p className="text-sm lg:text-base text-white/80 mt-4 font-light">
            {"Memorializing MIT since 1885"}
          </p>
        </div>

        {/* Photo Credit */}
        <p className="absolute bottom-4 right-4 text-xs text-white/50 z-20">
          {`Photo: ${"Daka Ejilemele"}`}
        </p>
      </section>
      <Footer />
    </div>
  );
}
