"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import Image from "next/image";
import { useTranslations, useLocale } from 'next-intl';
import Link from "next/link";

function YearbookPage() {
  const t = useTranslations('pages.yearbook');
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

        {/* Main Content */}
        <section className="section container-text">
          <div className="divider-accent mb-8 mx-auto" />

          <p>
            {t('description1')}
          </p>

          <p>
            {t('description2')}
          </p>

          {/* Yearbook Cover */}
          <div className="flex justify-center mt-12 mb-8">
            <div className="relative w-64 h-80">
              <Image
                src="/images/covers/2026_Yearbook_Cover_TNQ.webp"
                alt={t('coverAlt')}
                fill={true}
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>

          {/* Preorder CTA */}
          <div className="text-center mb-8">
            <a
              href="https://mit.universitytickets.com/w/event.aspx?id=1889"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              {t('preorderButton')}
            </a>
            <p className="text-sm text-text-muted mt-4">
              {t('preorderHint')}
            </p>
          </div>
        </section>

        {/* Info Section */}
        <section className="section-tight bg-bg-secondary">
          <div className="container-text">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{t('forSeniors.title')}</h4>
                <p className="text-sm pb-0">
                  Seniors who have a picture are highly encouraged to fill
                  out their information on the <Link href={`/${locale}/bio`} className="text-accent hover:text-accent-hover">{t('forSeniors.seniorBioLink')}</Link> page.
                  If you do not have a picture, schedule a time <Link href={`/${locale}/bio`} className="text-accent hover:text-accent-hover">{t('forSeniors.scheduleLink')}</Link>.
                  Email us at <a href="mailto:tnq-exec@mit.edu" className="text-accent hover:text-accent-hover">tnq-exec@mit.edu</a> if you have any extenuating circumstances.
                </p>
              </div>
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{t('release.title')}</h4>
                <p className="text-sm pb-0">
                  {t('release.content')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default YearbookPage;
