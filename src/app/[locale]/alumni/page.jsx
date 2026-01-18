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

        {/* Info Section */}
        <section className="section-tight bg-bg-secondary">
          <div className="container-text">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Visit Card */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{t('visit.title')}</h4>
                <p className="text-sm pb-0">
                  {t('visit.content')}
                </p>
              </div>

              {/* Outreach Card */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{t('outreach.title')}</h4>
                <p className="text-sm pb-4">
                  {t('outreach.content')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/${locale}/alumni-inquiry`}
                    className="btn-secondary inline-block hover:!bg-accent hover:!border-accent"
                  >
                    {t('outreach.formButton')}
                  </Link>
                  <a
                    href="mailto:technique@mit.edu"
                    className="btn-secondary inline-block hover:!bg-accent hover:!border-accent"
                  >
                    {t('outreach.emailButton')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AlumniPage;
