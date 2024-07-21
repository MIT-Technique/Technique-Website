"use client";
import React from "react";
import Footer from "@/components/Footer/Footer";
import CoverCard from "@/components/CoverCard/CoverCard";
import Image from "next/image";
import oneEightEightFive from "../../../public/images/covers/1885_Technique@2x.jpg";
import Navbar from "@/components/Navbar_and_Sidebar/Navbar_new";
const options = [
  {
    src: "/images/covers/1885_Technique@2x.jpg",
    alt: "MIT Technqiue 1885 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1885_Technique.pdf",
    title: "Technique 1885",
  },
  {
    src: "/images/covers/1886_Technique@2x.jpg",
    alt: "MIT Technqiue 1886 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1886_Technique.pdf",
    title: "Technique 1886",
  },
  {
    src: "/images/covers/1887_Technique@2x.jpg",
    alt: "MIT Technqiue 1887 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1887_Technique.pdf",
    title: "Technique 1887",
  },

  {
    src: "/images/covers/1889_Technique@2x.jpg",
    alt: "MIT Technqiue 1889 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1889_Technique.pdf",
    title: "Technique 1889",
  },
  {
    src: "/images/covers/1890_Technique@2x.jpg",
    alt: "MIT Technqiue 1890 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1890_Technique.pdf",
    title: "Technique 1890",
  },
  {
    src: "/images/covers/1892_Technique@2x.jpg",
    alt: "MIT Technqiue 1892 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1892_Technique.pdf",
    title: "Technique 1892",
  },
  {
    src: "/images/covers/1893_Technique@2x.jpg",
    alt: "MIT Technqiue 1893 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1893_Technique.pdf",
    title: "Technique 1893",
  },
  {
    src: "/images/covers/1894_Technique@2x.jpg",
    alt: "MIT Technqiue 1894 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1894_Technique.pdf",
    title: "Technique 1894",
  },
  {
    src: "/images/covers/1895_Technique@2x.jpg",
    alt: "MIT Technqiue 1895 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1895_Technique.pdf",
    title: "Technique 1895",
  },
  {
    src: "/images/covers/1896_Technique@2x.jpg",
    alt: "MIT Technqiue 1896 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1896_Technique.pdf",
    title: "Technique 1896",
  },
  {
    src: "/images/covers/1897_Technique@2x.jpg",
    alt: "MIT Technqiue 1897 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1897_Technique.pdf",
    title: "Technique 1897",
  },
  {
    src: "/images/covers/1898_Technique@2x.jpg",
    alt: "MIT Technqiue 1898 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1898_Technique.pdf",
    title: "Technique 1898",
  },
  {
    src: "/images/covers/1899_Technique@2x.jpg",
    alt: "MIT Technqiue 1899 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1899_Technique.pdf",
    title: "Technique 1899",
  },
  {
    src: "/images/covers/1900_Technique@2x.jpg",
    alt: "MIT Technique 1900 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1900_Technique.pdf",
    title: "Technique 1900",
  },
  {
    src: "/images/covers/1901_Technique@2x.jpg",
    alt: "MIT Technique 1901 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1901_Technique.pdf",
    title: "Technique 1901",
  },
  {
    src: "/images/covers/1902_Technique@2x.jpg",
    alt: "MIT Technique 1902 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1902_Technique.pdf",
    title: "Technique 1902",
  },
  {
    src: "/images/covers/1903_Technique@2x.jpg",
    alt: "MIT Technique 1903 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1903_Technique.pdf",
    title: "Technique 1903",
  },
  {
    src: "/images/covers/1904_Technique@2x.jpg",
    alt: "MIT Technique 1904 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1904_Technique.pdf",
    title: "Technique 1904",
  },
  {
    src: "/images/covers/1905_Technique@2x.jpg",
    alt: "MIT Technique 1905 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1905_Technique.pdf",
    title: "Technique 1905",
  },
  {
    src: "/images/covers/1906_Technique@2x.jpg",
    alt: "MIT Technique 1906 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1906_Technique.pdf",
    title: "Technique 1906",
  },
  {
    src: "/images/covers/1907_Technique@2x.jpg",
    alt: "MIT Technique 1907 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1907_Technique.pdf",
    title: "Technique 1907",
  },
  {
    src: "/images/covers/1908_Technique@2x.jpg",
    alt: "MIT Technique 1908 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1908_Technique.pdf",
    title: "Technique 1908",
  },
  {
    src: "/images/covers/1909_Technique@2x.jpg",
    alt: "MIT Technique 1909 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1909_Technique.pdf",
    title: "Technique 1909",
  },
  {
    src: "/images/covers/1910_Technique@2x.jpg",
    alt: "MIT Technique 1910 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1910_Technique.pdf",
    title: "Technique 1910",
  },
  {
    src: "/images/covers/1911_Technique@2x.jpg",
    alt: "MIT Technique 1911 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1911_Technique.pdf",
    title: "Technique 1911",
  },
  {
    src: "/images/covers/1912_Technique@2x.jpg",
    alt: "MIT Technique 1912 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1912_Technique.pdf",
    title: "Technique 1912",
  },
  {
    src: "/images/covers/1913_Technique@2x.jpg",
    alt: "MIT Technique 1913 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1913_Technique.pdf",
    title: "Technique 1913",
  },
  {
    src: "/images/covers/1914_Technique@2x.jpg",
    alt: "MIT Technique 1914 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1914_Technique.pdf",
    title: "Technique 1914",
  },
  {
    src: "/images/covers/1915_Technique@2x.jpg",
    alt: "MIT Technique 1915 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1915_Technique.pdf",
    title: "Technique 1915",
  },
  {
    src: "/images/covers/1916_Technique@2x.jpg",
    alt: "MIT Technique 1916 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1916_Technique.pdf",
    title: "Technique 1916",
  },
  {
    src: "/images/covers/1916_MIT_Sketches@2x.jpg",
    alt: "MIT Technique New Campus Sketches 1916",
    href: "http://web.mit.edu/technique/www/scans/1916_MIT_Sketches.pdf",
    title: "New Campus Sketches 1916",
  },
  {
    src: "/images/covers/1917_Technique@2x.jpg",
    alt: "MIT Technique 1917 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1917_Technique.pdf",
    title: "Technique 1917",
  },
  {
    src: "/images/covers/1918_Technique@2x.jpg",
    alt: "MIT Technique 1918 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1918_Technique.pdf",
    title: "Technique 1918",
  },
  {
    src: "/images/covers/1919_Technique@2x.jpg",
    alt: "MIT Technique 1919 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1919_Technique.pdf",
    title: "Technique 1919",
  },
  {
    src: "/images/covers/1920_Technique@2x.jpg",
    alt: "MIT Technique 1920 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1920_Technique.pdf",
    title: "Technique 1920",
  },
  {
    src: "/images/covers/1921_Technique@2x.jpg",
    alt: "MIT Technique 1921 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1921_Technique.pdf",
    title: "Technique 1921",
  },
  {
    src: "/images/covers/1922_Technique@2x.jpg",
    alt: "MIT Technique 1922 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1922_Technique.pdf",
    title: "Technique 1922",
  },
  {
    src: "/images/covers/1923_Technique@2x.jpg",
    alt: "MIT Technique 1923 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1923_Technique.pdf",
    title: "Technique 1923",
  },
  {
    src: "/images/covers/1924_Technique_Vol39@2x.jpg",
    alt: "MIT Technique 1924 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1924_Technique.pdf",
    title: "Technique 1924",
  },
  {
    src: "/images/covers/1925_Technique@2x.jpg",
    alt: "MIT Technique 1925 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1925_Technique.pdf",
    title: "Technique 1925",
  },
  {
    src: "/images/covers/1926_Technique@2x.jpg",
    alt: "MIT Technique 1926 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1926_Technique.pdf",
    title: "Technique 1926",
  },
  {
    src: "/images/covers/1927_Technique@2x.jpg",
    alt: "MIT Technique 1927 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1927_Technique.pdf",
    title: "Technique 1927",
  },
  {
    src: "/images/covers/1928_Freshman_Gray_Book@2x.jpg",
    alt: "MIT Technique 1928 Freshman Gray Book",
    href: "http://web.mit.edu/technique/www/scans/1928_Freshman_Gray_Book.pdf",
    title: "Freshman Gray Book 1928",
  },
  {
    src: "/images/covers/1928_Technique@2x.jpg",
    alt: "MIT Technique 1928 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1928_Technique.pdf",
    title: "Technique 1928",
  },
  {
    src: "/images/covers/1929_Technique@2x.jpg",
    alt: "MIT Technique 1929 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1929_Technique.pdf",
    title: "Technique 1929",
  },
  {
    src: "/images/covers/1930_Technique@2x.jpg",
    alt: "MIT Technique 1930 yearbook",
    href: "http://web.mit.edu/technique/www/scans/1930_Technique.pdf",
    title: "Technique 1930",
  },
];

function page() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen  flex flex-col lg:pt-[5vh] pt-[10vh] bg-white ">
        <main className="h-full w-full px-12 md:px-52 font-light  flex flex-col justify-center items-center ">
          <div className="flex flex-col justify-center items-center bg-[#265147] rounded-t-lg text-white pt-4">
            <div className="flex flex-col justify-center w-full items-center space-y-3 ">
              <p className="text-5xl font-extralight w-full text-center ">
                Archive
              </p>
              <p className=" text-center ">
                Take a look at some past editions of Technique.
              </p>
            </div>
            <div
              className=" w-[65vw] h-full rounded-2xl pt-5 flex flex-wrap items-center justify-center pb-5"
              id="section1"
            >
              {options.map(({ src, alt, href, title }, i) => {
                return (
                  <CoverCard
                    src={src}
                    alt={alt}
                    href={href}
                    title={title}
                    key={i}
                  ></CoverCard>
                );
              })}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default page;
