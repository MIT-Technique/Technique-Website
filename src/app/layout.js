import { Inter, Raleway } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar_and_Sidebar/Navbar_new";
import CookieConsent from "@/components/CookieConsent/CookieConsent";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const inter = Inter({ subsets: ["latin"] });
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

export const metadata = {
  title: "MIT Technique",
  description: "Memorializing MIT since 1885",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <body
        className={`${inter.className} ${raleway.variable} bg-[#FFFAFA] overflow-y-auto scroll-smooth relative`}
        suppressHydrationWarning
      >
        <Navbar />
        <div className="min-h-screen">{children}</div>
        <CookieConsent />
      </body>
    </html>
  );
}
