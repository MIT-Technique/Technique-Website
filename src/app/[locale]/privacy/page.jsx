"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  const t = useTranslations('pages.privacy');

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{t('title')}</h1>
          <p className="text-sm text-text-muted">
            {t('lastUpdated')}
          </p>
        </section>

        {/* Privacy Policy Content */}
        <section className="section container-narrow">
          <div className="prose prose-lg max-w-none">

            {/* Translation Disclaimer */}
            <div className="card mb-8 bg-bg-secondary border-l-4 border-accent">
              <h2>{t('translation.title')}</h2>
              <p>{t('translation.content')}</p>
            </div>

            {/* Information We Collect */}
            <div className="mb-8">
              <h2>{t('collection.title')}</h2>
              <p>{t('collection.intro')}</p>

              <h3>{t('collection.personalInfo.title')}</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>{t('collection.personalInfo.items.name')}</li>
                <li>{t('collection.personalInfo.items.email')}</li>
                <li>{t('collection.personalInfo.items.major')}</li>
                <li>{t('collection.personalInfo.items.quote')}</li>
                <li>{t('collection.personalInfo.items.photos')}</li>
              </ul>

              <h3>{t('collection.cookies.title')}</h3>
              <p>{t('collection.cookies.content')}</p>
              <ul className="list-disc pl-6 mb-4">
                <li>{t('collection.cookies.items.language')}</li>
                <li>{t('collection.cookies.items.session')}</li>
              </ul>

              <h3>{t('collection.analytics.title')}</h3>
              <p>{t('collection.analytics.content')}</p>
            </div>

            {/* How We Use Information */}
            <div className="mb-8">
              <h2>{t('usage.title')}</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>{t('usage.items.yearbook')}</li>
                <li>{t('usage.items.communication')}</li>
                <li>{t('usage.items.services')}</li>
                <li>{t('usage.items.improvement')}</li>
              </ul>
            </div>

            {/* Data Storage */}
            <div className="mb-8">
              <h2>{t('storage.title')}</h2>
              <p>{t('storage.content')}</p>
            </div>

            {/* Third-Party Services */}
            <div className="mb-8">
              <h2>{t('thirdParty.title')}</h2>
              <p>{t('thirdParty.intro')}</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>MIT Touchstone:</strong> {t('thirdParty.services.touchstone')}</li>
                <li><strong>MongoDB Atlas:</strong> {t('thirdParty.services.mongodb')}</li>
                <li><strong>Vercel:</strong> {t('thirdParty.services.vercel')}</li>
              </ul>
            </div>

            {/* Your Rights */}
            <div className="mb-8">
              <h2>{t('rights.title')}</h2>
              <p>{t('rights.intro')}</p>
              <ul className="list-disc pl-6 mb-4">
                <li>{t('rights.items.access')}</li>
                <li>{t('rights.items.correction')}</li>
                <li>{t('rights.items.deletion')}</li>
                <li>{t('rights.items.optOut')}</li>
              </ul>
              <p>{t('rights.contact')}</p>
            </div>

            {/* Children's Privacy */}
            <div className="mb-8">
              <h2>{t('children.title')}</h2>
              <p>{t('children.content')}</p>
            </div>

            {/* Changes to Policy */}
            <div className="mb-8">
              <h2>{t('changes.title')}</h2>
              <p>{t('changes.content')}</p>
            </div>

            {/* Contact Information */}
            <div className="card bg-bg-secondary">
              <h2>{t('contact.title')}</h2>
              <p>{t('contact.content')}</p>
              <p className="mt-4">
                <strong>Email:</strong> <a href="mailto:technique@mit.edu" className="text-accent hover:underline">technique@mit.edu</a><br />
                <strong>{t('contact.office')}</strong> Walker Memorial, Room 50-320<br />
                <strong>{t('contact.address')}</strong> MIT Technique, 32 Vassar Street, Cambridge, MA 02139
              </p>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
