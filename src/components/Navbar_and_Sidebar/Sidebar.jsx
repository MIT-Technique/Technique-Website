"use client";
import React, { useState, useEffect } from "react";
import SideBar from "./Sidebar.css";
import Link from "next/link";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import SchoolIcon from "@mui/icons-material/School";
import SearchIcon from "@mui/icons-material/Search";
import InventoryIcon from "@mui/icons-material/Inventory";
import FolderIcon from "@mui/icons-material/Folder";
import CallIcon from "@mui/icons-material/Call";
import { VscThreeBars } from "react-icons/vsc";
import ReceiptIcon from "@mui/icons-material/Receipt";
import FingerprintIcon from '@mui/icons-material/Fingerprint';
function Sidebar({ isScrolled, pathname }) {
  const [close, setClose] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // const targetElement = document.getElementById("element100");
  function handleClose() {
    setClose(true);
    setTimeout(function () {
      setIsOpen(false);
      setClose(false);
    }, 400);
  }
  useEffect(() => {
    console.log(pathname);
  }, []);

  return (
    <div
      className={`  ${
        pathname === "/"
          ? "bg-black text-white "
          : "bg-[#fffcf7] text-[#043b28]"
      }  h-[10vh]  lg:hidden flex top-0 z-30 w-full items-center font-sans justify-between px-4  `}
    >
      <Link
        className="text-xl font-bold "
        href="/"
        onClick={() => {
          setIsOpen(false);
        }}
      >
        TECHNIQUE
      </Link>
      <VscThreeBars
        style={{ color: pathname === "/" ? "white" : "#043b28" }}
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
            backgroundColor: pathname === "/" ? "black" : "#fffcf7",
            height: "100%",
            color: "white",
            overflowY: "auto",
          }}
          role="presentation"
          onClick={() => setIsOpen(false)}
          onKeyDown={() => setIsOpen(false)}
          className="text-sm"
        >
          <List>
            <ListItem>
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                // className="flex"
              >
                <ListItemButton>
                  <ListItemIcon>
                    <HomeIcon
                      sx={{
                        color: pathname === "/" ? "white" : "#043b28",
                        fontSize: "1.3rem",
                      }}
                    />
                  </ListItemIcon>

                  <ListItemText
                    primary={"HOME"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                    sx={{ color: pathname === "/" ? "white" : "#043b28" }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/about" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon>
                    <InfoIcon
                      sx={{
                        color: pathname === "/" ? "white" : "#043b28",
                        fontSize: "1.3rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"ABOUT"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                    sx={{ color: pathname === "/" ? "white" : "#043b28" }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/seniors" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon>
                    <SchoolIcon
                      sx={{
                        color: pathname === "/" ? "white" : "#043b28",
                        fontSize: "1.3rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"SENIORS"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                    sx={{ color: pathname === "/" ? "white" : "#043b28" }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/hire" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon>
                    <SearchIcon
                      sx={{
                        color: pathname === "/" ? "white" : "#043b28",
                        fontSize: "1.3rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"HIRE US"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                    sx={{ color: pathname === "/" ? "white" : "#043b28" }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>

            <ListItem>
              <Link href="/archives" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon>
                    <InventoryIcon
                      sx={{
                        color: pathname === "/" ? "white" : "#043b28",
                        fontSize: "1.3rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"ARCHIVES"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                    sx={{ color: pathname === "/" ? "white" : "#043b28" }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/portfolio" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon>
                    <FolderIcon
                      sx={{
                        color: pathname === "/" ? "white" : "#043b28",
                        fontSize: "1.3rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"PORTFOLIO"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                    sx={{ color: pathname === "/" ? "white" : "#043b28" }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/invoice" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon>
                    <ReceiptIcon
                      sx={{
                        color: pathname === "/" ? "white" : "#043b28",
                        fontSize: "1.3rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"INVOICE"}
                    primaryTypographyProps={{
                      style: {
                        fontSize: "0.8rem",
                        color: pathname === "/" ? "white" : "#043b28",
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/bio" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon>
                    <FingerprintIcon
                      sx={{
                        color: pathname === "/" ? "white" : "#043b28",
                        fontSize: "1.3rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"SENIOR BIO"}
                    primaryTypographyProps={{
                      style: {
                        fontSize: "0.8rem",
                        color: pathname === "/" ? "white" : "#043b28",
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            
            <ListItem>
              <Link href="/contact" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon>
                    <CallIcon
                      sx={{
                        color: pathname === "/" ? "white" : "#043b28",
                        fontSize: "1.3rem",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"CONTACT"}
                    primaryTypographyProps={{
                      style: {
                        fontSize: "0.8rem",
                        color: pathname === "/" ? "white" : "#043b28",
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            
          </List>
        </Box>
      </Drawer>
    </div>
  );
}

export default Sidebar;
