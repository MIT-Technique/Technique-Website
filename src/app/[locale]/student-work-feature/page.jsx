"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import { useTranslations } from 'next-intl';

function StudentWorkFeaturePage() {
  const t = useTranslations('pages.studentWorkFeature');

  const googleFormUrl = "https://forms.gle/thnitEZGJGTvwofB6";

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{t('title')}</h1>
          <p className="text-lg text-text-secondary font-light">
            {t('description')}
          </p>
        </section>

        {/* CTA Section */}
        <section className="section container-text text-center">
          <div className="divider-accent mb-8 mx-auto" />
          <a
            href={googleFormUrl}
            target="_blank"
            rel="noopener noreferrer"
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

export default StudentWorkFeaturePage;
