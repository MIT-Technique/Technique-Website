import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Raleway } from "next/font/google";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MIT Technique",
  description: "Memorializing MIT since 1885",
};
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway"
})

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${raleway.variable} overflow-y-auto scroll-smooth overflow-x-hidden`}>
        <Navbar></Navbar>
        {children}
      </body>
    </html>
  );
}
