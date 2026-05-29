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
import OrganizationAuthModal from "../OrganizationAuthModal/OrganizationAuthModal";
import { useUser } from "@/hooks/useUser";

function Sidebar({ pathname }) {
  const { isLoggedIn, user, club, sports, livingGroup, loading, logout } =
    useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // only one menu open at a time
  const [orgModalOpen, setOrgModalOpen] = useState(false);

  const toggleMenu = (menu) =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  // Get dashboard link based on role
  const getDashboardLink = () => {
    switch (user?.role) {
      case "admin":
        return `/dashboard`;
      case "club":
        return `/club`;
      case "living_group":
        return `/living-group`;
      default:
        return `/bio`;
    }
  };

  const isHomePage = pathname === "/";
  const textColor = isHomePage ? "#FFFFFF" : "#1A1A1A";
  const mutedColor = isHomePage ? "rgba(255,255,255,0.6)" : "#666666";
  const bgColor = isHomePage ? "#000000" : "#FFFAFA";
  const borderColor = isHomePage ? "rgba(255,255,255,0.1)" : "#E5E5E5";

  const isActive = (href) => {
    // Senior Bio link (/login) should only be active on exactly /login or /bio, not on /login/admin, /login/club, etc.
    if (href === `/login`) return pathname === `/login` || pathname === `/bio`;
    // For other paths, check exact match or subpath, but exclude login subpages from general matching
    if (pathname.startsWith(`/login/`)) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isAboutActive = [`/about`, `/archives`, `/portfolio`, `/contact`].some(
    isActive,
  );
  const isPurchaseActive = [
    `/purchase`,
    `/seniors`,
    `/parents`,
    `/alumni`,
  ].some(isActive);
  const isFormsActive = [
    `/login`,
    `/invoice`,
    `/parent-inquiry`,
    `/alumni-inquiry`,
  ].some(isActive);
  const isGetStartedActive = [`/hire`, `/join`].some(isActive);

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
        {"TECHNIQUE"}
      </Link>

      <button
        onClick={() => setIsOpen(true)}
        className="p-2 flex flex-col justify-center gap-1"
        aria-label="Open menu"
      >
        <div style={{ width: 20, height: 1, backgroundColor: textColor }} />
        <div style={{ width: 20, height: 1, backgroundColor: textColor }} />
        <div style={{ width: 20, height: 1, backgroundColor: textColor }} />
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
                onClick={() => toggleMenu("about")}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary={"ABOUT"}
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
                    transform:
                      openMenu === "about" ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </ListItemButton>
            </ListItem>
            <Collapse in={openMenu === "about"} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { href: `/about`, label: "OUR HISTORY" },
                  { href: `/archives`, label: "ARCHIVE" },
                  { href: `/portfolio`, label: "PORTFOLIO" },
                  { href: `/contact`, label: "CONTACT" },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      {...(item.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
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
                              color: isActive(item.href)
                                ? "#750014"
                                : mutedColor,
                            },
                          }}
                        />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Yearbook Dropdown */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => toggleMenu("purchase")}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary={"YEARBOOK"}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      color: isPurchaseActive ? "#750014" : textColor,
                    },
                  }}
                />
                <VscChevronDown
                  size={16}
                  style={{
                    color: isPurchaseActive ? "#750014" : textColor,
                    transform:
                      openMenu === "purchase"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </ListItemButton>
            </ListItem>
            <Collapse in={openMenu === "purchase"} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { href: `/purchase`, label: "PURCHASE", external: true },
                  { href: `/seniors`, label: "SENIORS" },
                  { href: `/parents`, label: "PARENTS" },
                  { href: `/alumni`, label: "ALUMNI" },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      {...(item.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
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
                              color: isActive(item.href)
                                ? "#750014"
                                : mutedColor,
                            },
                          }}
                        />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Forms Dropdown */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => toggleMenu("forms")}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary={"FORMS"}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      color: isFormsActive ? "#750014" : textColor,
                    },
                  }}
                />
                <VscChevronDown
                  size={16}
                  style={{
                    color: isFormsActive ? "#750014" : textColor,
                    transform:
                      openMenu === "forms" ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </ListItemButton>
            </ListItem>
            <Collapse in={openMenu === "forms"} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {/* Students Section */}
                <ListItem disablePadding>
                  <ListItemButton sx={{ pl: 5, py: 0.5 }} disabled>
                    <ListItemText
                      primary={"STUDENTS"}
                      primaryTypographyProps={{
                        sx: {
                          fontSize: "0.6rem",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          color: isHomePage ? "rgba(255,255,255,0.6)" : "#999",
                          textTransform: "uppercase",
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {[{ href: `/bio`, label: "SENIOR BIO" }].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      {...(item.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
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
                              color: isActive(item.href)
                                ? "#750014"
                                : mutedColor,
                            },
                          }}
                        />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                ))}

                {/* Guardians Section */}
                <ListItem disablePadding sx={{ mt: 1 }}>
                  <ListItemButton sx={{ pl: 5, py: 0.5 }} disabled>
                    <ListItemText
                      primary={"COMMUNITY"}
                      primaryTypographyProps={{
                        sx: {
                          fontSize: "0.6rem",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          color: isHomePage ? "rgba(255,255,255,0.6)" : "#999",
                          textTransform: "uppercase",
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {[
                  { href: `/invoice`, label: "INVOICE" },
                  { href: `/parent-inquiry`, label: "PARENT" },
                  { href: `/alumni-inquiry`, label: "ALUMNI" },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      {...(item.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
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
                              color: isActive(item.href)
                                ? "#750014"
                                : mutedColor,
                            },
                          }}
                        />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Resources */}
            <ListItem disablePadding>
              <Link
                href={`/resources`}
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                <ListItemButton sx={{ px: 3, py: 1.5 }}>
                  <ListItemText
                    primary={"FAQ"}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        color: isActive(`/resources`) ? "#750014" : textColor,
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>

            {/* Get Started Dropdown */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => toggleMenu("getStarted")}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary={`${"GET STARTED"} →`}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      color: isGetStartedActive ? "#750014" : textColor,
                    },
                  }}
                />
                <VscChevronDown
                  size={16}
                  style={{
                    color: isGetStartedActive ? "#750014" : textColor,
                    transform:
                      openMenu === "getStarted"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </ListItemButton>
            </ListItem>
            <Collapse
              in={openMenu === "getStarted"}
              timeout="auto"
              unmountOnExit
            >
              <List component="div" disablePadding>
                {[
                  { href: `/hire`, label: "HIRE US" },
                  { href: `/join`, label: "JOIN US" },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      {...(item.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
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
                              color: isActive(item.href)
                                ? "#750014"
                                : mutedColor,
                            },
                          }}
                        />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Account Section */}
            {!loading &&
              (isLoggedIn ? (
                <>
                  <ListItem disablePadding sx={{ mt: 1 }}>
                    <ListItemButton
                      onClick={() => toggleMenu("account")}
                      sx={{ px: 3, py: 1.5 }}
                    >
                      <ListItemText
                        primary={
                          sports?.name ||
                          club?.name ||
                          livingGroup?.name ||
                          user?.name ||
                          user?.email?.split("@")[0] ||
                          "SIGN IN"
                        }
                        primaryTypographyProps={{
                          sx: {
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            color: textColor,
                          },
                        }}
                      />
                      <VscChevronDown
                        size={16}
                        style={{
                          color: textColor,
                          transform:
                            openMenu === "account"
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Collapse
                    in={openMenu === "account"}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      <ListItem disablePadding>
                        <Link
                          href={getDashboardLink()}
                          onClick={() => setIsOpen(false)}
                          className="w-full"
                        >
                          <ListItemButton sx={{ pl: 6, py: 1 }}>
                            <ListItemText
                              primary={"DASHBOARD"}
                              primaryTypographyProps={{
                                sx: {
                                  fontSize: "0.7rem",
                                  fontWeight: 400,
                                  letterSpacing: "0.05em",
                                  color: mutedColor,
                                },
                              }}
                            />
                          </ListItemButton>
                        </Link>
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => {
                            setIsOpen(false);
                            logout();
                          }}
                          sx={{ pl: 6, py: 1 }}
                        >
                          <ListItemText
                            primary={"SIGN OUT"}
                            primaryTypographyProps={{
                              sx: {
                                fontSize: "0.7rem",
                                fontWeight: 400,
                                letterSpacing: "0.05em",
                                color: mutedColor,
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    </List>
                  </Collapse>
                </>
              ) : (
                <ListItem disablePadding sx={{ mt: 1 }}>
                  <ListItemButton
                    onClick={() => {
                      setIsOpen(false);
                      setOrgModalOpen(true);
                    }}
                    sx={{ px: 3, py: 1.5 }}
                  >
                    <ListItemText
                      primary={"SIGN IN"}
                      primaryTypographyProps={{
                        sx: {
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          letterSpacing: "0.1em",
                          color: textColor,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
        </Box>
      </Drawer>

      <OrganizationAuthModal
        open={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
      />
    </div>
  );
}

export default Sidebar;
