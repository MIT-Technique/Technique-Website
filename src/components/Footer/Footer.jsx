import React from "react";
import MailIcon from "@mui/icons-material/Mail";
import InstagramIcon from '@mui/icons-material/Instagram';
import { Tooltip } from "@mui/material";


export default function Footer() {
  const size = 16
  return (
    <div className={`bg-black h-[10vh] w-full z-50 relative text-gray-200 p-12 lg:flex items-center justify-between text-xs ${/*"bg-opacity-85"*/""}`}>
      <div>&copy; 2024 Technique. Images are property of their respective owners. All Rights Reserved.</div>
      <div className='flex lg:flex-row items-center justify-end'>
        <a href='mailto:tnq-exec@mit.edu'>
          <Tooltip title="Email Us" arrow>
            <MailIcon/>
          </Tooltip>
        </a>
        {/* Uncomment below when we get access again */}
        {/* <a href='https://www.instagram.com/mit_tnq/'>
          <Tooltip title="Follow us on Instagram" arrow>
            <InstagramIcon/>
          </Tooltip>
        </a> */}
      </div>
    </div>
  );
}
