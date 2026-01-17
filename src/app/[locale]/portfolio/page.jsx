"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import Image from "next/image";
import { useTranslations } from 'next-intl';

function PortfolioPage() {
  const t = useTranslations('pages.portfolio');

  const images = [
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA0925.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Andrew_Okyere/_MG_1028-Enhanced-NR.jpg",
      photographer: "Andrew Okyere",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA1149.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA2926.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Sebastian_Ochoa/000045080009.jpg",
      photographer: "Sebastian Ochoa",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA4087.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Ruhundaka_Ejilemele/DSC_4286.jpg",
      photographer: "Ruhundaka Ejilemele",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA4600.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Andrew_Okyere/_MG_0677.jpg",
      photographer: "Andrew Okyere",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA7811.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA9725.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Marcelo_Maza/MJM-21.jpg",
      photographer: "Marcelo Maza",
    },
    {
      src: "/images/other_images/Ruhundaka_Ejilemele/IMG_7711-2.jpg",
      photographer: "Ruhundaka Ejilemele",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA7594.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Sebastian_Ochoa/Y16333009673-R1-043-20.jpg",
      photographer: "Sebastian Ochoa",
    },
    {
      src: "/images/other_images/Ruhundaka_Ejilemele/DSC_5089.jpg",
      photographer: "Ruhundaka Ejilemele",
    },
    {
      src: "/images/other_images/Alison_Soong/20260915-P1050430.jpg",
      photographer: "Alison Soong",
    },
    {
      src: "/images/other_images/Ruhundaka_Ejilemele/DSC_4444.jpg",
      photographer: "Ruhundaka Ejilemele",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA3208.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA2389.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Ruhundaka_Ejilemele/DSC_6569.jpg",
      photographer: "Ruhundaka Ejilemele",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA2438.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA3772.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Alison_Soong/20140118-_TNQ0052.jpg",
      photographer: "Alison Soong",
    },
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-content text-center">
          <h1 className="mb-4">{t('title')}</h1>
          <p className="text-lg text-text-secondary font-light max-w-text mx-auto">
            {t('description')}
          </p>
        </section>

        {/* Photo Grid */}
        <section className="section container-content">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <figure
                key={index}
                className="relative aspect-square group overflow-hidden"
              >
                <Image
                  src={image.src}
                  alt={t('imageAlt', { photographer: image.photographer })}
                  fill={true}
                  style={{ objectFit: "cover" }}
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                {/* Hover overlay with photographer credit */}
                <figcaption className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-xs text-white font-light">
                    {image.photographer}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default PortfolioPage;
