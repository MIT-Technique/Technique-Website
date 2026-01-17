"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import { useTranslations } from 'next-intl';

function AboutPage() {
  const t = useTranslations('pages.about');

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-6">{t('title')}</h1>
          <p className="text-lg lg:text-xl text-text-secondary font-light leading-relaxed">
            {t('hero')}
          </p>
        </section>

        {/* Main Content */}
        <section className="section-tight container-text">
          <p>
            {t('paragraph1')}
          </p>
          <p>
            {t('paragraph2')}
          </p>
        </section>

        {/* Feature Cards */}
        <section className="section bg-bg-secondary">
          <div className="container-content">
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              {/* H.R.H. Grogo Card */}
              <div className="card">
                <div className="divider-accent mb-6" />
                <h3>{t('grogo.title')}</h3>
                <p>
                  {t('grogo.paragraph1')}
                </p>
                <p>
                  {t('grogo.paragraph2')}
                </p>
              </div>

              {/* Weekly Card */}
              <div className="card">
                <div className="divider-accent mb-6" />
                <h3>{t('weekly.title')}</h3>
                <p>
                  {t('weekly.paragraph1')}
                </p>
                <p>
                  {t('weekly.paragraph2')}
                </p>
                <p>
                  {t('weekly.paragraph3')}
                </p>
              </div>

              {/* staph Card */}
              <div className="card">
                <div className="divider-accent mb-6" />
                <h3>{t('staph.title')}</h3>
                <p>
                  {t('staph.paragraph1')}
                </p>
                <p>
                  {t('staph.paragraph2')}
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

export default AboutPage;
