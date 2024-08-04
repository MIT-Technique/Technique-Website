"use client";
import React from "react";
import MailIcon from "@mui/icons-material/Mail";
import InstagramIcon from "@mui/icons-material/Instagram";
import { Tooltip } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const size = 16;
  return (
    <div
      className={`${
        pathname === "/" ? "bg-black text-white " : "bg-[#fffcf7] text-black"
      } h-[10vh] w-full z-50 relative p-12 flex items-center space-x-3 md:justify-between text-xs  `}
    >
      <div
        className={`absolute top-0 w-[100%] px-3 h-2 left-0 ${
          pathname === "/" ? "hidden" : "block"
        }`}
      >
        <div className="w-full border-t-2 border-solid border-black h-full"></div>
      </div>
      <div>
        &copy; 2024 Technique. Images are property of their respective owners.
        All Rights Reserved.
      </div>
      <Link href="mailto:technique@mit.edu">
        <Tooltip title="Email Us" arrow>
          <MailIcon />
        </Tooltip>
      </Link>
      {/* <div className='flex  items-center justify-end'> */}
      {/* Uncomment below when we get access again */}
      {/* <a href='https://www.instagram.com/mit_tnq/'>
          <Tooltip title="Follow us on Instagram" arrow>
            <InstagramIcon/>
          </Tooltip>
        </a> */}
      {/* </div> */}
    </div>
  );
}
