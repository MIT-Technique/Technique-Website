"use client";
import React, { useState } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";
import SideBar from "./Sidebar.css";
import Link from "next/link";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";

function Sidebar(props) {
  const [close, setClose] = useState(false);
  // const targetElement = document.getElementById("element100");
  function handleClose() {
    setClose(true);
    setTimeout(function () {
      props.setIsOpen(false);
      setClose(false);
    }, 400);
  }

  return (
    // <div
    //   className={`w-[100vw] h-[100vh] bg-black absolute top-0 right-0 pointer-events-auto z-50 overflow-none ${
    //     !close ? "bg-black bg-opacity-15" : "bg-opacity-0"
    //   }`}
    //   id="element100"
    // >
    //   <div
    //     className={`bg-red-800 w-[70vw] h-[100vh] absolute right-0 top-0 rounded-l-3xl flex flex-col pullLeft ${
    //       close ? "pullRight" : ""
    //     }`}
    //   >
    //     <span className="w-[100%] h-16 flex justify-end p-6">
    //       <IoCloseCircleOutline
    //         style={{ height: "5vh", width: "5vh", color: "white" }}
    //         onClick={handleClose}
    //       />
    //     </span>
    //     <ul className=" text-sm">
    //       <Link
    //         className="pl-6 w-full  h-[5vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
    //         href="/"
    //         onClick={handleClose}
    //       >
    //         HOME
    //       </Link>
    //       <Link
    //         className="w-full pl-6 h-[5vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
    //         href="/about"
    //         onClick={handleClose}
    //       >
    //         ABOUT
    //       </Link>
    //       <Link
    //         className="w-full pl-6 h-[5vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
    //         href="/seniors"
    //         onClick={handleClose}
    //       >
    //         SENIORS
    //       </Link>
    //       <Link
    //         className="w-full pl-6 h-[5vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
    //         href="/hire"
    //         onClick={handleClose}
    //       >
    //         HIRE US
    //       </Link>
    //       <Link
    //         className="w-full pl-6 h-[5vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
    //         href="/join"
    //         onClick={handleClose}
    //       >
    //         JOIN US
    //       </Link>
    //       <Link
    //         className="w-full pl-6 h-[5vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
    //         href="/archives"
    //         onClick={handleClose}
    //       >
    //         ARCHIVES
    //       </Link>
    //       <Link
    //         className="w-full pl-6 h-[5vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
    //         href="/portfolio"
    //         onClick={handleClose}
    //       >
    //         PORTFOLIO
    //       </Link>
    //       <Link
    //         className="w-full pl-6 h-[5vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
    //         href="/contact"
    //         onClick={handleClose}
    //       >
    //         CONTACT
    //       </Link>
    //     </ul>
    //   </div>
    // </div>
    <Drawer open={props.open} onClose={()=>{setIsOpen(false)}} anchor="right">
      <Box
        sx={{ width: 250 }}
        role="presentation"
        onClick={props.setIsOpen(false)}
        onKeyDown={props.setIsOpen(false)}
      >
        <List>
          {["Inbox", "Starred", "Send email", "Drafts"].map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {["All mail", "Trash", "Spam"].map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
