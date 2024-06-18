"use client";
import React, { useState, useEffect } from "react";
import { VscThreeBars } from "react-icons/vsc";
import Sidebar from "./Sidebar";
import SidebarCSS from "./Sidebar.css";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation'

function Navbar() {
  const pathname = usePathname()

  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Alternate way to rerender whenever the pathname is updated, while still respecting addEventListener
  useEffect(()=>{
    const handleScroll = () => setIsScrolled(window.scrollY>0 || pathname !== "/");
    // Call the function on re-render in order to make sure it's the correct state on every page
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  },[pathname])

  return (
    <div className="flex flex-colrelative z-50">
      <span className={`hidden lg:flex bg-black font-sans h-[10vh] items-center px-12 lg:px-30 justify-between text-gray-200 fixed top-0 w-full z-50 transition-all ${isScrolled ? "bg-opacity-85" : "bg-opacity-0"}`}>
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
      <div className="bg-black  h-[10vh] lg:hidden flex fixed top-0 z-30 w-full items-center font-sans justify-between px-4 bg-opacity-85">
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
        {isOpen ? <Sidebar setIsOpen={setIsOpen}></Sidebar> : null}
      </div>
    </div>
  );
}

export default Navbar;
