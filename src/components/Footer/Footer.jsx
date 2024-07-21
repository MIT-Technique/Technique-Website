import React from "react";
import MailIcon from "@mui/icons-material/Mail";
import InstagramIcon from "@mui/icons-material/Instagram";
import { Tooltip } from "@mui/material";
import Link from "next/link";

export default function Footer() {
  const size = 16;
  return (
    <div
      className={`bg-black h-[10vh] w-full z-50 relative text-white p-12 flex items-center space-x-3 md:justify-between text-xs ${
        /*"bg-opacity-85"*/ ""
      }`}
    >
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
