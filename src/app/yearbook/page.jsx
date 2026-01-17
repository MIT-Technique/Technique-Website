"use client";
import React from "react";
import Footer from "../../components/Footer/Footer";
import Image from "next/image";

function YearbookPage() {
  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">Yearbook</h1>
          <p className="text-lg text-text-secondary font-light">
            Preserve your MIT memories with the official Technique yearbook.
          </p>
        </section>

        {/* Main Content */}
        <section className="section container-text">
          <div className="divider-accent mb-8 mx-auto" />

          <p>
            Every year, Technique publishes a 280-page yearbook commemorating
            life at MIT. Our dedicated staff of photographers, designers, and
            writers work throughout the year to capture the essence of the MIT
            experience.
          </p>

          <p>
            The yearbook features senior portraits, candid photography of campus
            life, coverage of major events, student organizations, athletics,
            and the unique culture that makes MIT special.
          </p>

          {/* Yearbook Cover */}
          <div className="flex justify-center mt-12 mb-8">
            <div className="relative w-64 h-80">
              <Image
                src="/images/covers/2026_Yearbook_Cover_TNQ.webp"
                alt="2026 Technique Yearbook Cover"
                fill={true}
                style={{ objectFit: "contain" }}
              />
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
              Preorder Your Copy
            </a>
            <p className="text-sm text-text-muted mt-4">
              Secure your yearbook at the discounted preorder price.
            </p>
          </div>
        </section>

        {/* Info Section */}
        <section className="section-tight bg-bg-secondary">
          <div className="container-text">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>For Seniors</h4>
                <p className="text-sm pb-0">
                  Seniors who have a picture are highly encouraged to fill out
                  their information on the{" "}
                  <a
                    href="/bio"
                    className="text-accent hover:text-accent-hover"
                  >
                    Senior Bio
                  </a>{" "}
                  page. If you do not have a picture, schedule a time{" "}
                  <a
                    href="/portrait"
                    className="text-accent hover:text-accent-hover"
                  >
                    here
                  </a>
                  . Email us at{" "}
                  <a
                    href="mailto:tnq-exec@mit.edu"
                    className="text-accent hover:text-accent-hover"
                  >
                    tnq-exec@mit.edu
                  </a>{" "}
                  if you have any extenuating circumstances.
                </p>
              </div>
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>Release</h4>
                <p className="text-sm pb-0">
                  The yearbook is released late Spring. Purchased copies must be
                  picked up on campus. Email us at{" "}
                  <a
                    href="mailto:tnq-exec@mit.edu"
                    className="text-accent hover:text-accent-hover"
                  >
                    tnq-exec@mit.edu
                  </a>{" "}
                  if you have any questions, concerns, or issues.
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
