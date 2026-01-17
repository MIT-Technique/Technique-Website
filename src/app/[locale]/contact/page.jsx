"use client";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import Image from "next/image";
import { useTranslations } from 'next-intl';

function ContactPage() {
  const t = useTranslations('pages.contact');

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Image */}
        <section className="container-content">
          <div className="relative aspect-[16/9] lg:aspect-[21/9] rounded overflow-hidden">
            <Image
              src="/images/club_photo/DSC_0815-3.jpg"
              alt={t('imageAlt')}
              fill={true}
              priority
              quality={100}
              style={{ objectFit: "cover" }}
            />
            <p className="absolute bottom-3 right-4 text-xs text-white/60">
              {t('imageCredit')}
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="section container-text">
          <div className="text-center mb-12">
            <h1 className="mb-4">{t('title')}</h1>
            <a
              href="mailto:technique@mit.edu"
              className="btn-primary"
            >
              {t('emailButton')}
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Visit Us Card */}
            <div className="card-elevated text-center">
              <h4 className="mb-4">{t('visit.title')}</h4>
              <address className="text-sm text-text-secondary not-italic leading-relaxed">
                {t('visit.address1')}
                <br />
                {t('visit.address2')}
                <br />
                {t('visit.address3')}
              </address>
            </div>

            {/* Mailing Address Card */}
            <div className="card-elevated text-center">
              <h4 className="mb-4">{t('mail.title')}</h4>
              <address className="text-sm text-text-secondary not-italic leading-relaxed">
                {t('mail.address1')}
                <br />
                {t('mail.address2')}
                <br />
                {t('mail.address3')}
              </address>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default ContactPage;
