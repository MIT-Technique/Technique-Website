"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import { useTranslations, useLocale } from 'next-intl';
import Link from "next/link";

function AlumniPage() {
  const t = useTranslations('pages.alumni');
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

        {/* MIT Alumni Section */}
        <section className="section-tight bg-bg-secondary">
          <div className="container-text">
            <h2 className="text-sm uppercase tracking-widest text-text-muted mb-6">{t('mitAlumni.sectionTitle')}</h2>
            <div className="card">
              <div className="divider-accent mb-4" />
              <h4>{t('mitAlumni.title')}</h4>
              <p className="text-sm pb-4">
                {t('mitAlumni.content')}
              </p>
              <Link
                href={`/${locale}/alumni-inquiry`}
                className="btn-secondary inline-block hover:!bg-accent hover:!border-accent"
              >
                {t('mitAlumni.formButton')}
              </Link>
            </div>
          </div>
        </section>

        {/* Technique Alumni Section */}
        <section className="section-tight">
          <div className="container-text">
            <h2 className="text-sm uppercase tracking-widest text-text-muted mb-6">{t('techniqueAlumni.sectionTitle')}</h2>
            <div className="card">
              <div className="divider-accent mb-4" />
              <h4>{t('techniqueAlumni.title')}</h4>
              <p className="text-sm pb-2">
                {t('techniqueAlumni.content')}
              </p>
              <p className="text-sm pb-4 text-text-secondary">
                {t('techniqueAlumni.contact')}
              </p>
              <a
                href="mailto:technique@mit.edu?subject=Technique%20Alumni%20Visit"
                className="btn-secondary inline-block hover:!bg-accent hover:!border-accent"
              >
                {t('techniqueAlumni.emailButton')}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AlumniPage;
