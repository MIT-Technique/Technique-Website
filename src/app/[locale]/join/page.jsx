"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from 'next-intl';

function JoinPage() {
  const t = useTranslations('pages.join');
  const tNav = useTranslations('nav');
  const locale = useLocale();

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

          {/* Image Gallery */}
          <div
            className="overflow-x-auto pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {[
                { src: '/images/design/Max Zhu/Activities.jpg', alt: 'Activities Spread' },
                { src: '/images/design/Max Zhu/Endgame.jpg', alt: 'Endgame Spread' },
                { src: '/images/design/Max Zhu/Journal.jpg', alt: 'Journal Spread' },
                { src: '/images/design/Max Zhu/LIH.jpg', alt: 'LIH Spread' },
                { src: '/images/design/Max Zhu/Living Groups.jpg', alt: 'Living Groups Spread' },
                { src: '/images/design/Max Zhu/Seniors.jpg', alt: 'Seniors Spread' },
                { src: '/images/design/Max Zhu/Sports.jpg', alt: 'Sports Spread' },
              ].map((image, index) => (
                <div key={index} className="relative w-48 h-64 flex-shrink-0 overflow-hidden rounded group">
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
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-tight container-text text-center">
          <div className="divider-accent mb-8 mx-auto" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:technique@mit.edu?subject=Joining%20Technique"
              className="btn-primary"
            >
              {t('cta.button')}
            </a>
            <Link
              href={`/${locale}/archives`}
              className="btn-secondary hover:!bg-accent hover:!border-accent"
            >
              {tNav('archive')}
            </Link>
          </div>
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
