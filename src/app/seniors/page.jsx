"use client";
import React from "react";
import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar_and_Sidebar/Navbar_new";
import { Button } from "@mui/material";
import Image from "next/image";

const senior_discounted_price = 60;
const preorder_discounted_price = 90;

function page() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white flex flex-col lg:pt-[5vh] pt-[10vh]">
        <main className="h-full w-full px-12 pb-4 md:px-60 md:pb-20">
          <div className="flex flex-col justify-center w-full items-center space-y-3 text-gray-700">
            <div className="pb-1 md:pb-5">
              <h1 className="text-5xl font-extralight w-full text-center">
                Seniors
              </h1>
              <p>
                Important information regarding Techique senior portrait
                sessions.
              </p>
            </div>
            <div className="pb-1 md:pb-5">
              <h1 className="text-3xl font-extralight w-full text-left">
                Scheduling
              </h1>
              <div>
                <p>
                  For the purposes of the Technique yearbook, seniors are
                  defined as undergraduate students who are in their fourth-year
                  of their studies as determined by the Registrar&apos;s office.
                </p>
                <p>
                  Every Technique yearbook dedicates a section of the
                  publication to photos and biographical information of seniors.
                  Seniors can schedule their senior portrait session using the
                  button below. We strongly suggest you book your appointment as
                  early as possible because spaces fill up fast.
                </p>
              </div>
              <div className="text-center pt-5">
                <Button
                  variant="outlined"
                  // comment out in order to enable
                  // disabled
                  sx={{
                    width: "auto",
                    borderColor: "black",
                    color: "black",
                    "&:hover": {
                      borderColor: "black",
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                  color="primary"
                  // Update to scheduling link when available
                  href="/"
                >
                  {" "}
                  Schedule Here
                </Button>
              </div>
            </div>
            <div className="pb-1 md:pb-5 bg-[#265147] rounded-lg text-white p-5">
              <h1 className="text-3xl font-extralight w-full text-left">
                Dress Code
              </h1>
              <div className="">
                <p>
                  There is no dress code for senior portraits. You can show up
                  in a suit, dress, or even your pajamas. We have even had
                  students bring their instruments and pets. We recommend
                  wearing something that you are comfortable being pictured in,
                  since your image will likely be on shelves of your peers for
                  decades to come.
                </p>
                <div className="flex flex-col md:flex-row items-start justify-center h-[50vh] w-full mt-[6vh] text-center">
                  <div className=" flex flex-col relative rounded-[0.3rem] h-[57.6%] w-[86.4%] md:h-[100%] md:w-[100%] overflow-hidden">
                    <div className="relative aspect-square w-full h-auto">
                      <Image
                        src="/images/Senior_Pictures/232010911.JPG"
                        alt="Informal Dress"
                        fill={true}
                        style={{
                          borderRadius: "0.3rem",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                    <p>Valid attire for photo</p>
                  </div>
                  <div className="flex flex-col relative rounded-[0.3rem] h-[57.6%] w-[86.4%] md:h-[100%] md:w-[100%] overflow-hidden">
                    <div className="relative aspect-square w-full h-auto">
                      <Image
                        src="/images/Senior_Pictures/232198679.JPG"
                        alt="senior picture"
                        fill={true}
                        style={{
                          borderRadius: "0.3rem",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                    <p>Also valid attire for photo</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pb-1 md:pb-5">
              <h1 className="text-3xl font-extralight w-full text-left">
                Senior (Class) Discount
              </h1>
              <div>
                {/* Final prices not available */}
                <p>
                  When you arrive at your appointment, you will be able to order
                  your yearbook for a special{" "}
                  <b>senior only discounted price</b>. This pricing only applies
                  to seniors who pay in person at their appointment, and is not
                  redeemable online.
                </p>
                <p>
                  If you do not wish to get your senior portrait, you are still
                  able to pre-order your yearbook at the{" "}
                  <b>pre-order discounted price</b> on our order page.
                </p>
                {/* Set final prices
                <p>
                  When you arrive at your appointment, you will be able to order
                  your yearbook for the{" "}
                  <b>discounted price of $[INSERT SENIOR PRICE HERE]</b>. This
                  pricing only applies to seniors who pay in person at their
                  appointment, and is not redeemable online.
                </p>
                <p>
                  If you do not wish to get your senior portrait, you are still
                  able to pre-order your yearbook for $
                  <b>[INSERT PREORDER PRICE HERE]</b> on our order page.
                </p> */}
              </div>
            </div>
            <div className="pb-1 md:pb-5">
              <h1 className="text-3xl font-extralight w-full text-left">
                Biographical Information
              </h1>
              <div>
                <p>
                  When you schedule your senior portrait, you will be able to
                  add and update the biographical information you would like to
                  appear in the yearbook. This includes your name as you would
                  like it to appear, your major(s)/minor, and a quote. If you
                  choose not to fill this information out, your name and
                  academic information will appear as recorded by the
                  Registrar&apos;s office.
                </p>
                <p>
                  Students without a senior portrait will have their
                  biographical information featured in a separate section for
                  those not pictured.
                </p>
              </div>
            </div>
            <div className="pb-1 md:pb-5">
              <h1 className="text-3xl font-extralight w-full text-left">
                Missed Session or Issues?
              </h1>
              <div>
                <p>
                  For all questions regarding scheduling senior portrait
                  sessions, late changes to biographical information, or any
                  other issues, please contact{" "}
                  <a href="mailto:tnq-exec@mit.edu">
                    <b className="text-sky-500 hover:text-blue-500">
                      <u>tnq-exec@mit.edu</u>
                    </b>
                  </a>
                  . Technique has a publication deadline for senior portraits,
                  so we unfortunately cannot accommodate any students who miss
                  all scheduled senior portrait sessions. Rest assured that your
                  name will appear in the yearbook in a section that does not
                  feature senior portraits.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default page;
