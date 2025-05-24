"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar.jsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbarcss from "./Navbar.css";

function Navbar() {
  const pathname = usePathname();
  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 0 || pathname !== "/") {
        setFirstLoad(false);
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }
    if (pathname !== "/") {
      setIsScrolled(true);
    }
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-colrelative z-50">
      <nav
        className={`hidden lg:flex bg-black font-sans h-[10vh] items-center px-12 lg:px-30 justify-between text-gray-200 fixed top-0 w-full z-50 realtive ${
          pathname == "/"
            ? ` ${
                isScrolled
                  ? `${firstLoad ? "bg-opacity-85" : "fade-in"} `
                  : `${firstLoad ? "bg-opacity-0" : "fade-out"}`
              }`
            : ""
        }`}
      >
        <Link
          className="text-sm xl:text-2xl font-bold text-white absolute  left-2  top-2 xl:left-4 xl:top-auto"
          href="/"
        >
          TECHNIQUE
        </Link>
        <div className="flex space-x-9 text-xs w-full justify-center font-semibold">
          <Link
            className={`px-5 py-2 relative z-10 cursor-pointer ${
              pathname == "/"
                ? "text-[#DD0002] underline underline-offset-3 decoration-2 hover:text-[#c4481b]"
                : "hover:text-white"
            }`}
            href="/"
          >
            HOME
          </Link>
          <Link
            className={`px-5 py-2 relative z-10 cursor-pointer hover:text-white `}
            href="/about"
          >
            ABOUT
          </Link>
          <Link
            className={`px-5 py-2 relative z-10 cursor-pointer hover:text-white `}
            href="/seniors"
          >
            SENIORS
          </Link>
          <Link
            className={`px-5 py-2 relative z-10 cursor-pointer hover:text-white`}
            href="/hire"
          >
            HIRE US
          </Link>

          <Link
            className={`px-5 py-2 relative z-10 cursor-pointer hover:text-white`}
            href="/archives"
          >
            ARCHIVES
          </Link>
          <Link
            className={`px-5 py-2 relative z-10 cursor-pointer hover:text-white`}
            href="/portfolio"
          >
            PORTFOLIO
          </Link>
          <Link
            className={`px-5 py-2 relative z-10 cursor-pointer hover:text-white`}
            href="/contact"
          >
            CONTACT
          </Link>
          <Link
            className={`px-5 py-2 relative z-10 cursor-pointer hover:text-white`}
            href="/invoice"
          >
            INVOICE
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
