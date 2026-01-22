"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import Image from "next/image";
import { useTranslations } from 'next-intl';

function HirePage() {
  const t = useTranslations('pages.hire');

  const images = [
    {
      src: "/images/other_images/Alison_Soong/20240915-P1050432.jpg",
      photographer: "Alison Soong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA2320.jpg",
      photographer: "Jade Chongsathapornpong",
    },
    {
      src: "/images/other_images/Jade_Chongsathapornpong/_TNA3975C.jpg",
      photographer: "Jade Chongsathapornpong",
    },
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{t('title')}</h1>
          <p className="text-lg text-text-secondary font-light">
            {t('hero')}
          </p>
        </section>

        {/* Image Gallery Strip */}
        <section className="w-full mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {images.map((image, index) => (
              <figure
                key={index}
                className="relative aspect-[4/3] group overflow-hidden"
              >
                <Image
                  src={image.src}
                  alt={t('imageAlt', { photographer: image.photographer })}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={index < 3}
                  style={{ objectFit: "cover" }}
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                {/* Hover overlay with photographer credit */}
                <figcaption className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end justify-end p-4">
                  <span className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {image.photographer}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="section container-text text-center">
          <p className="mb-8">
            {t('description')}
          </p>
          <a
            href="mailto:technique@mit.edu?subject=Event%20Photography%20Quote"
            className="btn-primary"
          >
            {t('ctaButton')}
          </a>
          <p className="text-sm text-text-muted mt-4">
            {t('ctaHint')}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default HirePage;
