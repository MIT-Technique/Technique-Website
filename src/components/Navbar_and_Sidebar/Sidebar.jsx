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
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import OrganizationAuthModal from "../OrganizationAuthModal/OrganizationAuthModal";
import { useUser } from "../../hooks/useUser";

function Sidebar({ pathname }) {
  const locale = useLocale();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tAccount = useTranslations('account');
  const { isLoggedIn, user, club, sports, livingGroup, loading, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [formsOpen, setFormsOpen] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [orgModalOpen, setOrgModalOpen] = useState(false);

  // Get dashboard link based on role
  const getDashboardLink = () => {
    switch (user?.role) {
      case 'admin':
        return `/${locale}/dashboard`;
      case 'club':
        return `/${locale}/club`;
      case 'living_group':
        return `/${locale}/living-group`;
      default:
        return `/${locale}/bio`;
    }
  };

  const isHomePage = pathname === `/${locale}`;
  const textColor = isHomePage ? "#FFFFFF" : "#1A1A1A";
  const mutedColor = isHomePage ? "rgba(255,255,255,0.6)" : "#666666";
  const bgColor = isHomePage ? "#000000" : "#FFFAFA";
  const borderColor = isHomePage ? "rgba(255,255,255,0.1)" : "#E5E5E5";

  const isActive = (href) => {
    // Senior Bio link (/login) should only be active on exactly /login or /bio, not on /login/admin, /login/club, etc.
    if (href === `/${locale}/login`) return pathname === `/${locale}/login` || pathname === `/${locale}/bio`;
    // For other paths, check exact match or subpath, but exclude login subpages from general matching
    if (pathname.startsWith(`/${locale}/login/`)) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isAboutActive = [`/${locale}/about`, `/${locale}/archives`, `/${locale}/portfolio`, `/${locale}/contact`].some(isActive);
  const isPurchaseActive = [`/${locale}/purchase`, `/${locale}/seniors`, `/${locale}/parents`, `/${locale}/alumni`].some(isActive);
  const isFormsActive = [`/${locale}/login`, `/${locale}/invoice`, `/${locale}/parent-inquiry`, `/${locale}/alumni-inquiry`, `/${locale}/candids`, `/${locale}/student-work-feature`].some(isActive);
  const isGetStartedActive = [`/${locale}/hire`, `/${locale}/join`].some(isActive);

  return (
    <div
      className={`${
        isHomePage ? "bg-black text-white" : "bg-[#FFFAFA] text-text-primary"
      } h-16 lg:hidden flex top-0 z-30 w-full items-center font-sans justify-between px-6`}
    >
      <Link
        className="text-lg font-medium tracking-wide"
        href={`/${locale}`}
        onClick={() => setIsOpen(false)}
        style={{ color: textColor }}
      >
        {tCommon('siteName')}
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
                onClick={() => setAboutOpen(!aboutOpen)}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary={t('about')}
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
                  { href: `/${locale}/about`, label: t('dropdown.ourHistory') },
                  { href: `/${locale}/archives`, label: t('archive') },
                  { href: `/${locale}/portfolio`, label: t('dropdown.portfolio') },
                  { href: `/${locale}/contact`, label: t('dropdown.contact') },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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

            {/* Yearbook Dropdown */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setPurchaseOpen(!purchaseOpen)}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary={t('yearbook')}
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
                    transform: purchaseOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </ListItemButton>
            </ListItem>
            <Collapse in={purchaseOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { href: `/${locale}/purchase`, label: t('purchase'), external: true },
                  { href: `/${locale}/seniors`, label: t('seniors') },
                  { href: `/${locale}/parents`, label: t('parents') },
                  { href: `/${locale}/alumni`, label: t('alumni') },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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

            {/* Forms Dropdown */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setFormsOpen(!formsOpen)}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary={t('forms')}
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
                    transform: formsOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </ListItemButton>
            </ListItem>
            <Collapse in={formsOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {/* Students Section */}
                <ListItem disablePadding>
                  <ListItemButton sx={{ pl: 5, py: 0.5 }} disabled>
                    <ListItemText
                      primary={t('dropdown.students')}
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
                  { href: `/${locale}/bio`, label: t('dropdown.seniorBio') },
                  { href: `/${locale}/candids`, label: t('dropdown.candids') },
                  { href: `/${locale}/student-work-feature`, label: t('dropdown.studentWork') },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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

                {/* Guardians Section */}
                <ListItem disablePadding sx={{ mt: 1 }}>
                  <ListItemButton sx={{ pl: 5, py: 0.5 }} disabled>
                    <ListItemText
                      primary={t('dropdown.community')}
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
                  { href: `/${locale}/invoice`, label: t('dropdown.invoice') },
                  { href: `/${locale}/parent-inquiry`, label: t('dropdown.parent') },
                  { href: `/${locale}/alumni-inquiry`, label: t('dropdown.alumni') },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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

            {/* Resources */}
            <ListItem disablePadding>
              <Link
                href={`/${locale}/resources`}
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                <ListItemButton sx={{ px: 3, py: 1.5 }}>
                  <ListItemText
                    primary={t('resources')}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        color: isActive(`/${locale}/resources`) ? "#750014" : textColor,
                      },
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>

            {/* Get Started Dropdown */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setGetStartedOpen(!getStartedOpen)}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary={`${t('getStarted')} →`}
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
                    transform: getStartedOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </ListItemButton>
            </ListItem>
            <Collapse in={getStartedOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { href: `/${locale}/hire`, label: t('dropdown.hireUs') },
                  { href: `/${locale}/join`, label: t('dropdown.joinUs') },
                ].map((item) => (
                  <ListItem key={item.href} disablePadding>
                    <Link
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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

            {/* Language Switcher */}
            <ListItem disablePadding sx={{ mt: 2, px: 3 }}>
              <LanguageSwitcher isHomePage={isHomePage} />
            </ListItem>

            {/* Account Section */}
            {!loading && (
              isLoggedIn ? (
                <>
                  <ListItem disablePadding sx={{ mt: 1 }}>
                    <ListItemButton
                      onClick={() => setAccountOpen(!accountOpen)}
                      sx={{ px: 3, py: 1.5 }}
                    >
                      <ListItemText
                        primary={sports?.name || club?.name || livingGroup?.name || user?.first_name || user?.email?.split('@')[0] || tAccount('login')}
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
                          transform: accountOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={accountOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      <ListItem disablePadding>
                        <Link
                          href={getDashboardLink()}
                          onClick={() => setIsOpen(false)}
                          className="w-full"
                        >
                          <ListItemButton sx={{ pl: 6, py: 1 }}>
                            <ListItemText
                              primary={tAccount('dashboard')}
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
                            primary={tAccount('signOut')}
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
                <>
                  <ListItem disablePadding sx={{ mt: 1 }}>
                    <ListItemButton
                      onClick={() => {
                        setIsOpen(false);
                        setOrgModalOpen(true);
                      }}
                      sx={{ px: 3, py: 1.5 }}
                    >
                      <ListItemText
                        primary={tAccount('organizationLogin')}
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
                  <ListItem disablePadding sx={{ px: 3, pt: 0.5 }}>
                    <Link
                      href={`/${locale}/login/admin`}
                      onClick={() => setIsOpen(false)}
                      style={{
                        fontSize: "0.65rem",
                        color: mutedColor,
                        textDecoration: "none",
                      }}
                    >
                      {tAccount('staph')}
                    </Link>
                  </ListItem>
                </>
              )
            )}
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
