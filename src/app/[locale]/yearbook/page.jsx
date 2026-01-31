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
            <div className="relative w-64 h-80 group overflow-hidden">
              <Image
                src="/images/covers/2026_Yearbook_Cover_TNQ.webp"
                alt={t('coverAlt')}
                fill={true}
                sizes="256px"
                style={{ objectFit: "contain" }}
                className="transition-transform duration-500 group-hover:scale-105"
              />
              {/* Photo Credit on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-xs text-white font-light">
                  {t('coverCredit')}
                </span>
              </div>
            </div>
          </div>

          {/* Preorder CTA */}
          <div className="text-center mb-8">
            <a
              href="https://engage.mit.edu/technique/rsvp_boot?id=916938"
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
                  {t.rich('forSeniors.content', {
                    email: 'tnq-exec@mit.edu',
                    seniorBioLink: (chunks) => <Link href={`/${locale}/bio`} className="text-accent hover:text-accent-hover">{chunks}</Link>,
                    scheduleLink: (chunks) => <Link href={`/${locale}/bio`} className="text-accent hover:text-accent-hover">{chunks}</Link>,
                  })}
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

        {/* Forms Section */}
        <section className="section container-text text-center">
          <div className="divider-accent mb-8 mx-auto" />
          <h3 className="mb-6">{t('forms.title')}</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/clubs`}
              className="btn-secondary hover:!bg-accent hover:!border-accent"
            >
              {t('forms.clubsButton')}
            </Link>
            <Link
              href={`/${locale}/student-work-feature`}
              className="btn-secondary hover:!bg-accent hover:!border-accent"
            >
              {t('forms.studentWorkButton')}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default YearbookPage;
