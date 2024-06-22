"use client";
import React, { useState, useEffect } from "react";
import { VscThreeBars } from "react-icons/vsc";
import Sidebar from "./Sidebar";
import SidebarCSS from "./Sidebar.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

import { IoCloseCircleOutline } from "react-icons/io5";
import SideBar from "./Sidebar.css";
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
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import SchoolIcon from "@mui/icons-material/School";
import SearchIcon from "@mui/icons-material/Search";
import InventoryIcon from "@mui/icons-material/Inventory";
import FolderIcon from "@mui/icons-material/Folder";
import CallIcon from "@mui/icons-material/Call";
import PersonIcon from "@mui/icons-material/Person";

function Navbar() {
  const pathname = usePathname();

  useEffect(() => {
    console.log("In useEffect!!!");
    function handleScroll() {
      console.log(pathname);
      // console.log(window)
      if (window.scrollY > 0 || pathname !== "/") {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }
    if (pathname !== "/") {
      setIsScrolled(true);
      console.log("HEERREEE");
    }
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-colrelative z-50">
      <span
        className={`hidden lg:flex bg-black font-sans h-[10vh] items-center px-12 lg:px-30 justify-between text-gray-200 fixed top-0 w-full z-50 transition-all ${
          isScrolled ? "bg-opacity-85" : "bg-opacity-0"
        }`}
      >
        <Link className="text-xl lg:text-2xl font-bold text-white" href="/">
          TECHNIQUE
        </Link>
        <div className="flex space-x-9 text-sm">
          <Link className="hover:text-white" href="/">
            HOME
          </Link>
          <Link className="hover:text-white" href="/about">
            ABOUT
          </Link>
          <Link className="hover:text-white" href="/seniors">
            SENIORS
          </Link>
          <Link className="hover:text-white" href="/hire">
            HIRE US
          </Link>
          <Link className="hover:text-white" href="/join">
            JOIN US
          </Link>
          <Link className="hover:text-white" href="/archives">
            ARCHIVES
          </Link>
          <Link className="hover:text-white" href="/portfolio">
            PORTFOLIO
          </Link>
          <Link className="hover:text-white" href="/contact">
            CONTACT
          </Link>
        </div>
      </span>
      <div
        className={`bg-black  h-[10vh]  lg:hidden flex fixed top-0 z-30 w-full items-center font-sans justify-between px-4 ${
          isScrolled ? "bg-opacity-85" : "bg-opacity-0"
        }`}
      >
        <Link
          className="text-xl font-bold text-white"
          href="/"
          onClick={() => {
            setIsOpen(false);
          }}
        >
          TECHNIQUE
        </Link>
        <VscThreeBars
          style={{ color: "white" }}
          onClick={() => setIsOpen(true)}
        />
        <Drawer
          open={isOpen}
          onClose={() => {
            setIsOpen(false);
          }}
          anchor="right"
          className="bg-transparent"
          sx={{
            "& .MuiDrawer-paper": {
              background: "transparent",
            },
          }}
        >
          <Box
            sx={{
              width: 250,
              backgroundColor: "black",
              height: "100%",
              color: "white",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "white",
            }}
            role="presentation"
            onClick={() => setIsOpen(false)}
            onKeyDown={() => setIsOpen(false)}
          >
            <List>
              <ListItem>
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  // className="flex"
                >
                  <ListItemButton>
                    <ListItemIcon color="white">
                      <HomeIcon color="white" sx={{ color: "white" }} />
                    </ListItemIcon>

                    <ListItemText primary={"HOME"} />
                  </ListItemButton>
                </Link>
              </ListItem>
              <ListItem>
                <Link href="/about" onClick={() => setIsOpen(false)}>
                  <ListItemButton>
                    <ListItemIcon color="white">
                      <InfoIcon color="white" sx={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText primary={"ABOUT"} />
                  </ListItemButton>
                </Link>
              </ListItem>
              <ListItem>
                <Link href="/seniors" onClick={() => setIsOpen(false)}>
                  <ListItemButton>
                    <ListItemIcon color="white">
                      <SchoolIcon color="white" sx={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText primary={"SENIORS"} />
                  </ListItemButton>
                </Link>
              </ListItem>
              <ListItem>
                <Link href="/hire" onClick={() => setIsOpen(false)}>
                  <ListItemButton>
                    <ListItemIcon color="white">
                      <SearchIcon color="white" sx={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText primary={"HIRE US"} />
                  </ListItemButton>
                </Link>
              </ListItem>
              <ListItem>
                <Link href="/join" onClick={() => setIsOpen(false)}>
                  <ListItemButton>
                    <ListItemIcon color="white">
                      <PersonIcon color="white" sx={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText primary={"JOIN US"} />
                  </ListItemButton>
                </Link>
              </ListItem>
              <ListItem>
                <Link href="/archives" onClick={() => setIsOpen(false)}>
                  <ListItemButton>
                    <ListItemIcon color="white">
                      <InventoryIcon color="white" sx={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText primary={"ARCHIVES"} />
                  </ListItemButton>
                </Link>
              </ListItem>
              <ListItem>
                <Link href="/portfolio" onClick={() => setIsOpen(false)}>
                  <ListItemButton>
                    <ListItemIcon color="white">
                      <FolderIcon color="white" sx={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText primary={"PORTFOLIO"} />
                  </ListItemButton>
                </Link>
              </ListItem>
              <ListItem>
                <Link href="/contact" onClick={() => setIsOpen(false)}>
                  <ListItemButton>
                    <ListItemIcon color="white">
                      <CallIcon color="white" sx={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText primary={"CONTACT"} />
                  </ListItemButton>
                </Link>
              </ListItem>
            </List>
          </Box>
        </Drawer>
      </div>
    </div>
  );
}

export default Navbar;
