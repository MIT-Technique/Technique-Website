import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar_and_Sidebar/Navbar_new";
import { Raleway } from "next/font/google";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Footer from "@/components/Footer/Footer";
import { ChakraProvider } from "@chakra-ui/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MIT Technique",
  description: "Memorializing MIT since 1885",
};
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${raleway.variable} overflow-y-auto scroll-smooth relative`} >
        <Navbar />
        <div className="bg-[#fffcf7] ">
          {children}
        </div>
      </body>
    </html>
  );
}
