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
    <>
      <div className="flex flex-col relative z-50 bg-transparent bg-white">
        <nav
          className={`hidden lg:flex  font-sans h-[10vh] items-center px-12 lg:px-30 justify-between text-[#265147]  top-0 w-full z-50  `}
        >
          <Link
            className="text-xl lg:text-2xl font-bold  absolute left-4"
            href="/"
          >
            TECHNIQUE
          </Link>
          <div className="flex space-x-9 text-xs w-full justify-center font-semibold">
            <Link
              className={` ${
                pathname == "/"
                  ? "text-white  hover:bg-[#265147] p-2 rounded-md bg-[#FF581c]"
                  : "hover:text-[#FF581c] p-2"
              }`}
              href="/"
            >
              HOME
            </Link>
            <Link
              className={` ${
                pathname == "/about"
                  ? "text-white  hover:bg-[#265147] p-2 rounded-md bg-[#FF581c]"
                  : "hover:text-[#FF581c] p-2"
              }`}
              href="/about"
            >
              ABOUT
            </Link>
            <Link
              className={` ${
                pathname == "/seniors"
                  ? "text-white  hover:bg-[#265147] p-2 rounded-md bg-[#FF581c]"
                  : "hover:text-[#FF581c] p-2"
              }`}
              href="/seniors"
            >
              SENIORS
            </Link>
            <Link
              className={` ${
                pathname == "/hire"
                  ? "text-white  hover:bg-[#265147] p-2 rounded-md bg-[#FF581c]"
                  : "hover:text-[#FF581c] p-2"
              }`}
              href="/hire"
            >
              HIRE US
            </Link>

            <Link
              className={` ${
                pathname == "/archives"
                  ? "text-white  hover:bg-[#265147] p-2 rounded-md bg-[#FF581c]"
                  : "hover:text-[#FF581c] p-2"
              }`}
              href="/archives"
            >
              ARCHIVES
            </Link>
            <Link
              className={` ${
                pathname == "/portfolio"
                  ? "text-white  hover:bg-[#265147] p-2 rounded-md bg-[#FF581c]"
                  : "hover:text-[#FF581c] p-2"
              }`}
              href="/portfolio"
            >
              PORTFOLIO
            </Link>
            <Link
              className={` ${
                pathname == "/contact"
                  ? "text-white  hover:bg-[#265147] p-2 rounded-md bg-[#FF581c]"
                  : "hover:text-[#FF581c] p-2"
              }`}
              href="/contact"
            >
              CONTACT
            </Link>
          </div>
        </nav>
      </div>
      <Sidebar isScrolled={isScrolled} />
    </>
  );
}

export default Navbar;
