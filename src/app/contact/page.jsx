import React from "react";
import Image from "next/image";

import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar_and_Sidebar/Navbar";

function page() {
  return (
    <>
      <Navbar/>
      <div className="min-h-screen w-screen bg-white flex flex-col py-[15vh] md:pt-[15vh] md:pb-[5vh]">
        <main className="flex relative flex-col px-[5vw] md:flex-row justify-center items-center w-full h-full font-light text-gray-700">
          {/* idk what image to add, but here's a template for it */}
          {/* <div className="relative aspect-square w-full h-auto mx-4">
          <Image
                src="/images/other_images/[INSERT IMAGE PATH HERE]"
                alt=""
                fill={true}
                style={{
                  borderRadius: "0.3rem",
                  objectFit: "contain",
                }}
              />
          </div> */}
          <div>
            <h1 className="text-3xl">Contact Us</h1>
            <br/>
            <div>
              <h2 className="text-xl">To hire a photographer</h2>
              <p>
                Please reach out to <a href='mailto:tnq-exec@mit.edu'><b className="text-sky-500 hover:text-blue-500"><u>tnq-exec@mit.edu</u></b></a>, and include:
              </p>
              <ul className="list-disc pl-8">
                <li>Location</li>
                <li>Date and Time</li>
                <li>Minimum number of hours needed</li>
                <li>Type of event (formal dinner, conference, etc.)</li>
              </ul>
            </div>
            <br/>
            <div>
              <h2 className="text-xl">For an ongoing job</h2>
              <p>Please reply in the same email chain on which you got in contact with us. Either the photographer or one of our Editors in Chief will respond to any questions, updates, or issues.</p>
            </div>
            <br/>
            <div>
              <h2 className="text-xl">General questions</h2>
              <p>Email us at <a href='mailto:technique@mit.edu'><b className="text-sky-500 hover:text-blue-500"><u>technique@mit.edu</u></b></a> with any questions or information. If you are interested in joining, please see our <a href="/join"><b className="text-sky-500 hover:text-blue-500"><u>Join Us</u></b></a> page for more details.</p>
            </div>
            {/* Not sure whether to include this or not */}
            {/* <br/>
            <div>            
              <h2 className="text-xl">Physical Mail</h2>
              <p>Address to:</p>
              <address className="pl-4">
                MIT Technique<br/>
                32 Vassar St.<br/>
                50-320<br/>
                Cambridge, MA 02139
              </address>
            </div> */}
          </div>
        </main>
      </div>
      <Footer/>
    </>
  );
}

export default page;
