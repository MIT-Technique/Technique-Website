"use client";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Sidebar from "./Sidebar.jsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbarcss from "./Navbar.css";

function Navbar() {
  const pathname = usePathname();
  const [firstLoad, setFirstLoad] = useState(true);
  const indicatorRef = useRef(null);
  const width1 = useRef(null);
  const navRef = useRef();
  const techniqueLabel = useRef()


  useLayoutEffect(() => {
    const activeNavItem = document.querySelector(".nav-item.active");
    let rect;
    let height1;
    const navElement = navRef.current
    let resizeObserver;

    if (activeNavItem && indicatorRef.current) {
      const rect = activeNavItem.getBoundingClientRect();
      const parentRect = activeNavItem.parentElement.getBoundingClientRect();
      const offsetLeft = activeNavItem.offsetLeft - parentRect.left;
      const offsetTop = activeNavItem.offsetTop - parentRect.top;

      indicatorRef.current.style.width = `${rect.width}px`;
      indicatorRef.current.style.height = `${rect.height}px`;
      indicatorRef.current.style.transform = `translateX(${offsetLeft}px) `;
      if (!firstLoad) {
        indicatorRef.current.style.transition = 'all 0.3s ease';
      }
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const rect = activeNavItem.getBoundingClientRect();
          const parentRect =
            activeNavItem.parentElement.getBoundingClientRect();
          const offsetLeft = activeNavItem.offsetLeft - parentRect.left;
          const offsetTop = activeNavItem.offsetTop - parentRect.top;

          indicatorRef.current.style.width = `${rect.width}px`;
          indicatorRef.current.style.height = `${rect.height}px`;
          indicatorRef.current.style.transform = `translateX(${offsetLeft}px) `;
        }
      });
      resizeObserver.observe(navRef.current);
    }
    setFirstLoad(false)
    return () => {
      resizeObserver?.unobserve(navElement);
    };
  }, [pathname]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={`hidden bg-[#fffcf7] flex-col relative z-50  ${pathname == "/" ? "hidden" : " lg:flex"}`}>
        <nav
          className={`h-[10vh]  text-[#043b28]  top-0 w-full flex items-center`}
          ref={navRef}
        >
          <Link
            className="text-sm xl:text-2xl font-bold  absolute left-2  top-2 xl:left-4 xl:top-auto"
            href="/"
          >
            TECHNIQUE
          </Link>
          <div className="flex space-x-9 text-xs w-full justify-center font-semibold">
            <Link
              className={`nav-item ${pathname == "/" ? "active" : ""} ${(firstLoad && pathname == "/") ? "bg-[#043b28] rounded-[4px]" : ""}`}
              href="/"
            >
              HOME
            </Link>
            <Link
              className={`nav-item ${pathname == "/about" ? "active" : ""} ${(firstLoad && pathname == "/about") ? "bg-[#043b28] rounded-[4px]" : ""}`}
              href="/about"
            >
              ABOUT
            </Link>
            <Link
              className={`nav-item ${pathname == "/seniors" ? "active" : ""} ${(firstLoad && pathname == "/seniors") ? "bg-[#043b28] rounded-[4px]" : ""}`}
              href="/seniors"
            >
              SENIORS
            </Link>
            <Link
              className={`nav-item ${pathname == "/hire" ? "active" : ""} ${(firstLoad && pathname == "/hire") ? "bg-[#043b28] rounded-[4px]" : ""}`}
              href="/hire"
            >
              HIRE US
            </Link>

            <Link
              className={`nav-item ${pathname == "/archives" ? "active" : ""} ${(firstLoad && pathname == "/archives") ? "bg-[#043b28] rounded-[4px]" : ""}`}
              href="/archives"
            >
              ARCHIVES
            </Link>
            <Link
              className={`nav-item ${pathname == "/portfolio" ? "active" : ""} ${(firstLoad && pathname == "/portfolio") ? "bg-[#043b28] rounded-[4px]" : ""}`}
              href="/portfolio"
            >
              PORTFOLIO
            </Link>
            <Link
              className={`nav-item ${pathname == "/contact" ? "active" : ""} ${(firstLoad && pathname == "/contact") ? "bg-[#043b28] rounded-[4px]" : ""}`}
              href="/contact"
            >
              CONTACT
            </Link>
            <Link
              className={`nav-item ${pathname == "/invoice" ? "active" : ""} ${(firstLoad && pathname == "/invoice") ? "bg-[#043b28] rounded-[4px]" : ""}`}
              href="/invoice"
            >
              INVOICE
            </Link>
          </div>
          <div ref={indicatorRef} className="indicator"></div>
        </nav>
      </div>
      <Sidebar isScrolled={isScrolled} pathname={pathname} />
    </>
  );
}

export default Navbar;
