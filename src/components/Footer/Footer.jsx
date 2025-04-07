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
        pathname === "/" ? "bg-black text-white" : "text-black"
      } h-[10vh] w-full z-50 relative p-12 flex items-center space-x-3 md:justify-between text-xs  `}
    >
      <div
        className={`absolute top-0 w-[100%] h-2 left-0 px-3 ${
          pathname === "/" ? "hidden" : "block"
        }`}
      >
        <div className="w-full border-t-2 border-solid border-black h-full"></div>
      </div>
      <div>
        &copy; 2024 Technique. Images are property of their respective owners.
        All Rights Reserved.
      </div>
      <div>
        <a href="mailto:technique@mit.edu">
          <Tooltip title="Email Us" arrow>
            <MailIcon />
          </Tooltip>
        </a>
        <a href="https://www.instagram.com/mit.tnq/" className="px-5" target="_blank" rel="noopener noreferrer">
          <Tooltip title="Check us out!" arrow>
            <InstagramIcon/>
          </Tooltip>
        </a>
      </div>
    </div>
  );
}
