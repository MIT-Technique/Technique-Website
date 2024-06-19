"use client";
import React from "react";
import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar_and_Sidebar/Navbar";

function page() {
  return (
    <>
      <Navbar/>
      <div className="min-h-screen h-screen bg-white flex flex-col pt-[15vh]">
        <main className="h-full w-full px-12 md:px-60">Seniors</main>
      </div>
    </>
  );
}

export default page;
