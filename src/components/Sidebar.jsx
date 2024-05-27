"use client";
import React, { useState } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";
import SideBar from "./Sidebar.css";
import Link from "next/link";

function Sidebar(props) {
  const [close, setClose] = useState(false);
  const targetElement = document.getElementById("element100");
  function handleClose() {
    setClose(true);
    setTimeout(function () {
      props.setIsOpen(false);
      setClose(false);
    }, 400);
  }
  //   targetElement.focus()
  // console.log(targetElement)
  // targetElement?.focus()
  // console.log(targetElement)

  return (
    <div
      className={`w-[100vw] h-[100vh] bg-black absolute top-0 right-0 pointer-events-auto overflow-none ${
        !close ? "bg-black bg-opacity-15" : "bg-opacity-0"
      }`}
      id="element100"
    >
      <div
        className={`bg-red-800 w-[70vw] h-[100vh] absolute right-0 top-0 rounded-l-3xl flex flex-col pullLeft ${
          close ? "pullRight" : ""
        }`}
      >
        <span className="w-[100%] h-16 flex justify-end p-6">
          <IoCloseCircleOutline
            style={{ height: "5vh", width: "5vh", color: "white" }}
            onClick={handleClose}
          />
        </span>
        <ul className="space-y-4 ">
          <Link
            className="pl-6 w-full  h-[7vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
            href="/"
            onClick={handleClose}
          >
            HOME
          </Link>
          <Link
            className="w-full pl-6 h-[7vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
            href="/about"
            onClick={handleClose}
          >
            ABOUT
          </Link>
          <Link
            className="w-full pl-6 h-[7vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
            href="/seniors"
            onClick={handleClose}
          >
            SENIORS
          </Link>
          <Link
            className="w-full pl-6 h-[7vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
            href="/hire"
            onClick={handleClose}
          >
            HIRE US
          </Link>
          <Link
            className="w-full pl-6 h-[7vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
            href="/join"
            onClick={handleClose}
          >
            JOIN US
          </Link>
          <Link
            className="w-full pl-6 h-[7vh] text-white flex items-center hover:bg-red-900 active:bg-red-700"
            href="/archives"
            onClick={handleClose}
          >
            ARCHIVES
          </Link>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
