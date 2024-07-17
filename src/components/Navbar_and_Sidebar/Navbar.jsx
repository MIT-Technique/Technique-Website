"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar.jsx";
import Link from "next/link";
import { usePathname } from "next/navigation";


function Navbar() {
  const pathname = usePathname();

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 0 || pathname !== "/") {
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
      <Sidebar isScrolled={isScrolled} />
    </div>
  );
}

export default Navbar;
