"use client";
import React, { useState } from "react";
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
import PersonIcon from "@mui/icons-material/Person";
import { VscThreeBars } from "react-icons/vsc";

function Sidebar({ isScrolled }) {
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

  return (
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
                  <ListItemIcon color="white">
                    <HomeIcon
                      color="white"
                      sx={{ color: "white", fontSize: "1.3rem" }}
                    />
                  </ListItemIcon>

                  <ListItemText
                    primary={"HOME"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/about" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon color="white">
                    <InfoIcon
                      color="white"
                      sx={{ color: "white", fontSize: "1.3rem" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"ABOUT"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/seniors" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon color="white">
                    <SchoolIcon
                      color="white"
                      sx={{ color: "white", fontSize: "1.3rem" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"SENIORS"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/hire" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon color="white">
                    <SearchIcon
                      color="white"
                      sx={{ color: "white", fontSize: "1.3rem" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"HIRE US"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>

            <ListItem>
              <Link href="/archives" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon color="white">
                    <InventoryIcon
                      color="white"
                      sx={{ color: "white", fontSize: "1.3rem" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"ARCHIVES"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/portfolio" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon color="white">
                    <FolderIcon
                      color="white"
                      sx={{ color: "white", fontSize: "1.3rem" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"PORTFOLIO"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/contact" onClick={() => setIsOpen(false)}>
                <ListItemButton>
                  <ListItemIcon color="white">
                    <CallIcon
                      color="white"
                      sx={{ color: "white", fontSize: "1.3rem" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={"CONTACT"}
                    primaryTypographyProps={{
                      style: { fontSize: "0.8rem" },
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
