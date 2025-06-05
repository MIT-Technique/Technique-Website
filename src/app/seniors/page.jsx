"use client";
import React from "react";
import Footer from "../../components/Footer/Footer";
import Image from "next/image";

const senior_discounted_price = 60;
const preorder_discounted_price = 90;

function page() {
  return (
    <>
      <div className="min-h-screen flex flex-col lg:pt-[5vh] pt-[10vh]">
        <main className="h-full w-full pb-4 px-12 md:px-48 md:pb-20">
          <div className="flex flex-col justify-center w-full items-center space-y-3 ">
            <div className="pb-1 md:pb-5">
              <h1>Seniors</h1>
              <p>Important information regarding Techique for seniors.</p>
            </div>
            <div className="pb-1 md:pb-5">
              <h2 className="text-center mb-1">Yearbook Order</h2>
              <div>
                <p className="text-center">
                  We’re excited to announce that Technique sales for the 140
                  <sup>th</sup> edition of the yearbook are now open! You can
                  order a copy at <b>$105 until 11:59 PM on 05/11</b>{" "}
                  <a
                    href="https://technique.mit.edu/order"
                    className="text-blue-400 font-bold"
                  >
                    here.
                  </a>
                </p>
              </div>
            </div>
            <div className="pb-1 md:pb-5 overflow-hidden w-full h-1/2 flex flex-col items-center ">
              <h2 className="text-center mb-3">Technique 2025 Cover Sneak Peak</h2>
              <div className="w-[80%] aspect-[1312/809] overflow-hidden relative">
                <Image
                  src="/images/covers/TNQ_Cover_2025.jpg"
                  alt="Contact Image showing Technique's Managing Board 2023-2024"
                  priority
                  quality={100}
                  fill={true}
                  sizes=""
                  style={{  objectFit: "contain", objectPosition:"top"}}
                />
              </div>
              {/* <div className="text-center pt-5">
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
                  href="https://forms.gle/e5wXz1riVpxKAfoc9"
                >
                  {" "}
                  Submit Here
                </Button>
              </div> */}
            </div>
            {/* <div className="pb-4 md:pb-8  rounded-lg text-black p-5">
              <h2 className="text-left flex flex-col pb-8">
                <p>Dress Code</p>
                <div className="w-full border-t-[3px] border-solid border-[#075d3e] h-full "></div>
              </h2>
              <div>
                <p>
                  There is no dress code for senior portraits. You can show up
                  in a suit, dress, or even your pajamas. We have even had
                  students bring their instruments and pets. We recommend
                  wearing something that you are comfortable being pictured in,
                  since your image will likely be on shelves of your peers for
                  decades to come.
                </p>
                <div className="flex flex-col md:flex-row items-center justify-center w-full mt-[6vh] text-center">
                  <div className=" flex flex-col relative rounded-[0.3rem] h-[57.6%] w-[86.4%] md:h-[100%] md:w-[100%] overflow-hidden">
                    <div className="relative aspect-square w-full h-auto">
                      <Image
                        src="/images/Senior_Pictures/232010911.JPG"
                        alt="Informal Dress in Senior Picture"
                        fill={true}
                        style={{
                          borderRadius: "0.3rem",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                    <p className="pt-4">Valid attire for photo</p>
                  </div>
                  <div className="flex flex-col relative rounded-[0.3rem] h-[57.6%] w-[86.4%] md:h-[100%] md:w-[100%] overflow-hidden">
                    <div className="relative aspect-square w-full h-auto">
                      <Image
                        src="/images/Senior_Pictures/232198679.JPG"
                        alt="Formal Dress in Senior Picture"
                        fill={true}
                        style={{
                          borderRadius: "0.3rem",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                    <p className="pt-4">Also valid attire for photo</p>
                  </div>
                </div>
              </div>
            </div> */}
            {/* <div className="py-1 md:py-5">
              <h2 className="text-left">Senior (Class) Discount</h2>
              <div>
                Final prices not available
                <p>
                  When you arrive at your appointment, you will be able to order
                  your yearbook for a special{" "}
                  <b>senior only discounted price</b>. This pricing only applies
                  to seniors who attend their appointment, and is not redeemable
                  online.
                </p>
                <p>
                  If you do not wish to get your senior portrait, you are still
                  able to pre-order your yearbook at the{" "}
                  <b>pre-order discounted price</b> on our order page.
                </p>
                Set final prices
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
                </p>
              </div>
            </div> */}

            {/* <div className="pb-1 md:pb-5">
              <h2 className="text-left">Missed Session or Issues?</h2>
              <div>
                <p>
                  For all questions regarding scheduling senior portrait
                  sessions, late changes to biographical information, or any
                  other issues, please contact{" "}
                  <a className="text-blue-400" href="mailto:tnq-exec@mit.edu">
                    tnq-exec@mit.edu
                  </a>
                  . Technique has a publication deadline for senior portraits,
                  so we unfortunately cannot accommodate any students who miss
                  all scheduled senior portrait sessions. Rest assured that your
                  name will appear in the yearbook in a section that does not
                  feature senior portraits.
                </p>
              </div>
            </div> */}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default page;
