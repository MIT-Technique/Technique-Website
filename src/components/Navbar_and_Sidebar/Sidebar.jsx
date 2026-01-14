"use client";
import React, { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import { VscThreeBars, VscClose, VscChevronDown } from "react-icons/vsc";

function Sidebar({ pathname }) {
  const [isOpen, setIsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [seniorsOpen, setSeniorsOpen] = useState(false);

  const isHomePage = pathname === "/";
  const textColor = isHomePage ? "#FFFFFF" : "#1A1A1A";
  const mutedColor = isHomePage ? "rgba(255,255,255,0.6)" : "#666666";
  const bgColor = isHomePage ? "#000000" : "#FFFAFA";
  const borderColor = isHomePage ? "rgba(255,255,255,0.1)" : "#E5E5E5";

  const isActive = (href) => {
    if (href === "/login") return pathname === "/login" || pathname === "/bio";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isAboutActive = ["/about", "/portfolio", "/contact"].some(isActive);
  const isSeniorsActive = ["/seniors", "/login"].some(isActive);

  return (
    <div
      className={`${
        isHomePage ? "bg-black text-white" : "bg-[#FFFAFA] text-text-primary"
      } h-16 lg:hidden flex top-0 z-30 w-full items-center font-sans justify-between px-6`}
    >
      <Link
        className="text-lg font-medium tracking-wide"
        href="/"
        onClick={() => setIsOpen(false)}
        style={{ color: textColor }}
      >
        TECHNIQUE
      </Link>

      <button
        onClick={() => setIsOpen(true)}
        className="p-2"
        aria-label="Open menu"
      >
        <VscThreeBars size={24} style={{ color: textColor }} />
      </button>

      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        anchor="right"
        sx={{
          "& .MuiDrawer-paper": {
            backgroundColor: bgColor,
            borderLeft: `1px solid ${borderColor}`,
          },
        }}
      >
        <Box
          sx={{
            width: 280,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
          role="presentation"
        >
          {/* Header with close button */}
          <div
            className="flex items-center justify-between px-6 h-16"
            style={{ borderBottom: `1px solid ${borderColor}` }}
          >
            <span
              className="text-lg font-medium tracking-wide"
              style={{ color: textColor }}
            >
              MENU
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2"
              aria-label="Close menu"
            >
              <VscClose size={24} style={{ color: textColor }} />
            </button>
          </div>

          {/* Nav Items */}
          <List sx={{ flex: 1, pt: 2 }}>
            {/* About Dropdown */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setAboutOpen(!aboutOpen)}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary="ABOUT"
                  primaryTypographyProps={{
                    sx: {
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      color: isAboutActive ? "#750014" : textColor,
                    },
                  }}
                />
                <VscChevronDown
                  size={16}
                  style={{
                    color: isAboutActive ? "#750014" : textColor,
                    transform: aboutOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </ListItemButton>
            </ListItem>
            <Collapse in={aboutOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { href: "/about", label: "Our History" },
                  { href: "/portfolio", label: "Portfolio" },
                  { href: "/contact", label: "Contact" },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="w-full"
                    >
                      <ListItemButton sx={{ pl: 6, py: 1 }}>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            sx: {
                              fontSize: "0.7rem",
                              fontWeight: 400,
                              letterSpacing: "0.05em",
                              color: isActive(item.href) ? "#750014" : mutedColor,
                            },
                          }}
                        />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Archives */}
            <ListItem disablePadding>
              <Link
                href="/archives"
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                <ListItemButton sx={{ px: 3, py: 1.5 }}>
                  <ListItemText
                    primary="ARCHIVES"
                    primaryTypographyProps={{
                      sx: {
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        color: isActive("/archives") ? "#750014" : textColor,
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>

            {/* Invoice */}
            <ListItem disablePadding>
              <Link
                href="/invoice"
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                <ListItemButton sx={{ px: 3, py: 1.5 }}>
                  <ListItemText
                    primary="INVOICE"
                    primaryTypographyProps={{
                      sx: {
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        color: isActive("/invoice") ? "#750014" : textColor,
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>

            {/* Seniors Dropdown */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setSeniorsOpen(!seniorsOpen)}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary="SENIORS"
                  primaryTypographyProps={{
                    sx: {
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      color: isSeniorsActive ? "#750014" : textColor,
                    },
                  }}
                />
                <VscChevronDown
                  size={16}
                  style={{
                    color: isSeniorsActive ? "#750014" : textColor,
                    transform: seniorsOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </ListItemButton>
            </ListItem>
            <Collapse in={seniorsOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { href: "/seniors", label: "Portraits" },
                  { href: "/login", label: "Senior Bio" },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="w-full"
                    >
                      <ListItemButton sx={{ pl: 6, py: 1 }}>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            sx: {
                              fontSize: "0.7rem",
                              fontWeight: 400,
                              letterSpacing: "0.05em",
                              color: isActive(item.href) ? "#750014" : mutedColor,
                            },
                          }}
                        />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Hire Us */}
            <ListItem disablePadding>
              <Link
                href="/hire"
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                <ListItemButton sx={{ px: 3, py: 1.5 }}>
                  <ListItemText
                    primary="HIRE US →"
                    primaryTypographyProps={{
                      sx: {
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        color: isActive("/hire") ? "#750014" : textColor,
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
