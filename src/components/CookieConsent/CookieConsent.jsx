"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import Link from "next/link";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Small delay to avoid flash on page load
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <div
        className={`max-w-4xl mx-auto rounded-lg shadow-lg border ${
          isHomePage
            ? "bg-black/90 backdrop-blur-md border-white/10 text-white"
            : "bg-white border-border text-text-primary"
        }`}
      >
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p
              className={`text-sm ${
                isHomePage ? "text-white/80" : "text-text-secondary"
              }`}
            >
              We use cookies to enhance your experience and manage
              authentication sessions.{" "}
              <Link
                href={`/privacy`}
                className={`underline hover:no-underline ${
                  isHomePage ? "text-white" : "text-accent"
                }`}
              >
                Learn more
              </Link>
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleAccept}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded transition-colors ${
                isHomePage
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-accent text-white hover:bg-accent/90"
              }`}
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
