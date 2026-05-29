"use client";
import React from "react";
import Footer from '@/components/Footer/Footer';
import Image from "next/image";
function ContactPage() {

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Image */}
        <section className="container-content">
          <div className="relative aspect-[16/9] lg:aspect-[21/9] rounded overflow-hidden">
            <Image
              src="/images/club_photo/DSC_0815-3.jpg"
              alt={"Technique Managing Board"}
              fill={true}
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
              quality={100}
              style={{ objectFit: "cover" }}
            />
            <p className="absolute bottom-3 right-4 text-xs text-white/60">
              {"MIT Technique"}
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="section container-text">
          <div className="text-center mb-12">
            <h1 className="mb-4">{"Get in Touch"}</h1>
            <a
              href="mailto:technique@mit.edu"
              className="btn-primary"
            >
              {"Email Us"}
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Visit Us Card */}
            <div className="card-elevated text-center">
              <h4 className="mb-4">{"Visit Us"}</h4>
              <address className="text-sm text-text-secondary not-italic leading-relaxed">
                {"142 Memorial Dr."}
                <br />
                {"Walker Memorial"}
                <br />
                {"Room 50-320"}
              </address>
            </div>

            {/* Mailing Address Card */}
            <div className="card-elevated text-center">
              <h4 className="mb-4">{"Mailing Address"}</h4>
              <address className="text-sm text-text-secondary not-italic leading-relaxed">
                {"MIT Technique"}
                <br />
                {"32 Vassar Street"}
                <br />
                {"Cambridge, MA 02139"}
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
