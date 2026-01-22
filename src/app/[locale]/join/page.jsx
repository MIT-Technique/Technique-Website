"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import Image from "next/image";
import { useTranslations } from 'next-intl';

function JoinPage() {
  const t = useTranslations('pages.join');

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

        {/* Welcome Section */}
        <section className="section-tight container-text text-center">
          <div className="divider-accent mb-8 mx-auto" />
          <p className="text-lg mb-8">
            {t('welcome')}
          </p>
        </section>

        {/* Opportunities Section */}
        <section className="section bg-bg-secondary">
          <div className="container-text">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Photography */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{t('photography.title')}</h4>
                <p className="text-sm">
                  {t('photography.description')}
                </p>
              </div>

              {/* Design */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{t('design.title')}</h4>
                <p className="text-sm">
                  {t('design.description')}
                </p>
              </div>

              {/* Business */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{t('business.title')}</h4>
                <p className="text-sm">
                  {t('business.description')}
                </p>
              </div>

              {/* Collaboration */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{t('collaboration.title')}</h4>
                <p className="text-sm pb-0">
                  {t('collaboration.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Past Work Section */}
        <section className="section container-text">
          <div className="text-center mb-12">
            <div className="divider-accent mb-8 mx-auto" />
            <h3 className="mb-4">{t('pastWork.title')}</h3>
            <p className="text-lg text-text-secondary font-light">
              {t('pastWork.description')}
            </p>
          </div>

          {/* Infinite Scroll Gallery */}
          <div className="overflow-hidden rounded">
            <div className="flex animate-scroll hover:pause-animation">
              {/* First set of images */}
              {[
                { src: '/images/design/Max Zhu/Activities.jpg', alt: 'Activities Spread' },
                { src: '/images/design/Max Zhu/Endgame.jpg', alt: 'Endgame Spread' },
                { src: '/images/design/Max Zhu/Journal.jpg', alt: 'Journal Spread' },
                { src: '/images/design/Max Zhu/LIH.jpg', alt: 'LIH Spread' },
                { src: '/images/design/Max Zhu/Living Groups.jpg', alt: 'Living Groups Spread' },
                { src: '/images/design/Max Zhu/Seniors.jpg', alt: 'Seniors Spread' },
                { src: '/images/design/Max Zhu/Sports.jpg', alt: 'Sports Spread' },
              ].map((image, index) => (
                <div key={index} className="relative w-48 h-64 flex-shrink-0 overflow-hidden rounded group mx-1.5">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill={true}
                    sizes="192px"
                    style={{ objectFit: "contain" }}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {[
                { src: '/images/design/Max Zhu/Activities.jpg', alt: 'Activities Spread' },
                { src: '/images/design/Max Zhu/Endgame.jpg', alt: 'Endgame Spread' },
                { src: '/images/design/Max Zhu/Journal.jpg', alt: 'Journal Spread' },
                { src: '/images/design/Max Zhu/LIH.jpg', alt: 'LIH Spread' },
                { src: '/images/design/Max Zhu/Living Groups.jpg', alt: 'Living Groups Spread' },
                { src: '/images/design/Max Zhu/Seniors.jpg', alt: 'Seniors Spread' },
                { src: '/images/design/Max Zhu/Sports.jpg', alt: 'Sports Spread' },
              ].map((image, index) => (
                <div key={`dup-${index}`} className="relative w-48 h-64 flex-shrink-0 overflow-hidden rounded group mx-1.5">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill={true}
                    sizes="192px"
                    style={{ objectFit: "contain" }}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
          <style jsx>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .animate-scroll {
              animation: scroll 40s linear infinite;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
          `}</style>
        </section>

        {/* CTA Section */}
        <section className="section-tight container-text text-center">
          <div className="divider-accent mb-8 mx-auto" />
          <a
            href="mailto:technique@mit.edu?subject=Joining%20Technique"
            className="btn-primary"
          >
            {t('cta.button')}
          </a>
          <p className="text-sm text-text-muted mt-4">
            {t('cta.hint')}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default JoinPage;
