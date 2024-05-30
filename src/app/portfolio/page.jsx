import React from "react";
import Footer from "@/components/Footer/Footer";
import SimpleCarousel from "@/components/SimpleCarousel/SimpleCarousel";

function page() {
  return (
    <div className="min-h-screen h-screen w-screen bg-blue-300 flex flex-col pt-[15vh]">
      <main className="w-full h-full px-12 md:px-60">
        <SimpleCarousel/>
      </main>
      <Footer></Footer>
    </div>
  );
}

export default page;
