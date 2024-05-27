import React from "react";
import Footer from "@/components/Footer";

function page() {
  return (
    <div className="h-screen w-full overflow-y-auto flex-col">
      <main className="h-full w-full bg-white pt-[15vh] px-60 font-light text-gray-700 ">
        page
      </main>
      <Footer></Footer>
    </div>
  );
}

export default page;
