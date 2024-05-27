"use client";
import React, { useState } from "react";
import { VscThreeBars } from "react-icons/vsc";
import Sidebar from "./Sidebar";
import SidebarCSS from "./Sidebar.css"
import Link from 'next/link'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className=" flex-col">
      <span className="hidden md:flex rounded-b-xl bg-black font-sans h-[10vh] items-center px-24 lg:px-36 justify-between text-gray-200 fixed top-0 w-full z-50 bg-opacity-85">
        <Link className="text-2xl font-bold text-white" href="/">TECHNIQUE</Link>
        <div className="flex space-x-4">
          <Link className="hover:text-white" href="/">HOME</Link>
          <Link className="hover:text-white" href="/about">ABOUT</Link>
          <Link className="hover:text-white" href="/seniors">SENIORS</Link>
          <Link className="hover:text-white" href="/hire">HIRE US</Link>
          <Link className="hover:text-white" href="/join">JOIN US</Link>
          <Link className="hover:text-white" href="/archives">ARCHIVES</Link>
        </div>
      </span>
      <div className="bg-black  h-[10vh] rounded-b-xl md:hidden flex fixed top-0 z-30 w-full items-center font-sans justify-between px-4 bg-opacity-85">
        <Link className="text-xl font-bold text-white" href="/">TECHNIQUE</Link>
        <VscThreeBars
          style={{ color: "white" }}
          onClick={() => setIsOpen(true)}
        />
        {isOpen ? <Sidebar setIsOpen={setIsOpen}></Sidebar> : null}

        {/* <div className="bg-blue-300 w-[70vw] h-[100vh] absolute right-0 top-0">
          <p className={`text-black ${isOpen ? "flex": "hidden"}`}> CLOSE P2</p>
        </div> */}
      </div>
    </div>
  );
}

export default Navbar;
