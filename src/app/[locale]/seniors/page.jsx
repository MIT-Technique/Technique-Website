"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import Image from "next/image";
import { useTranslations } from 'next-intl';

function SeniorsPage() {
  const t = useTranslations('pages.seniors');

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{t('title')}</h1>
          <p className="text-lg text-text-secondary font-light mb-8">
            {t('hero')}
          </p>
          <a
            href="https://seniors.legacystudios.com/massachusetts-institute-technology-cambridge-ma/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            {t('scheduleButton')}
          </a>
        </section>

        {/* Dress Code Section */}
        <section className="section container-text">
          <div className="divider-accent mb-6" />
          <h2 className="mb-4">{t('dressCode.title')}</h2>
          <p>
            {t('dressCode.content')}
          </p>

          {/* Example Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <figure>
              <div className="relative aspect-square overflow-hidden rounded">
                <Image
                  src="/images/Senior_Pictures/232010911.JPG"
                  alt={t('dressCode.informalAlt')}
                  fill={true}
                  style={{ objectFit: "cover" }}
                />
              </div>
              <figcaption className="text-sm text-text-muted mt-3 text-center">
                {t('dressCode.informalCaption')}
              </figcaption>
            </figure>
            <figure>
              <div className="relative aspect-square overflow-hidden rounded">
                <Image
                  src="/images/Senior_Pictures/232198679.JPG"
                  alt={t('dressCode.formalAlt')}
                  fill={true}
                  style={{ objectFit: "cover" }}
                />
              </div>
              <figcaption className="text-sm text-text-muted mt-3 text-center">
                {t('dressCode.formalCaption')}
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Senior Discount Section */}
        <section className="section-tight container-text">
          <div className="divider-accent mb-6" />
          <h2 className="mb-4">{t('discount.title')}</h2>
          <p>
            {t('discount.paragraph1')}
          </p>
          <p>
            {t('discount.paragraph2')}
          </p>
        </section>

        {/* Issues Section */}
        <section className="section-tight container-text">
          <div className="divider-accent mb-6" />
          <h2 className="mb-4">{t('issues.title')}</h2>
          <p>
            For all questions regarding scheduling senior portrait sessions,
            late changes to biographical information, or any other issues,
            please contact{" "}
            <a
              href="mailto:tnq-exec@mit.edu"
              className="text-accent hover:text-accent-hover"
            >
              tnq-exec@mit.edu
            </a>
            . Technique has a publication deadline for senior portraits, so we
            unfortunately cannot accommodate any students who miss all scheduled
            senior portrait sessions. Rest assured that your name will appear in
            the yearbook in a section that does not feature senior portraits.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default SeniorsPage;
