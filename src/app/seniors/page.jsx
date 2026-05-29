"use client";
import React from "react";
import Footer from '@/components/Footer/Footer';
import Image from "next/image";
import Link from "next/link";

function SeniorsPage() {

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{"Seniors"}</h1>
          <p className="text-lg text-text-secondary font-light mb-8">
            {"Senior portrait sessions open on a rolling basis."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://seniors.legacystudios.com/massachusetts-institute-technology-cambridge-ma/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              {"Schedule Your Portrait"}
            </a>
            <Link
              href={`/bio`}
              className="px-6 py-3 text-sm border border-accent text-accent font-medium hover:bg-accent hover:text-white transition-colors"
            >
              {"SELF-SUBMISSIONS"}
            </Link>
          </div>
        </section>

        {/* Dress Code Section */}
        <section className="section container-text">
          <div className="divider-accent mb-6" />
          <h2 className="mb-4">{"Dress Code"}</h2>
          <p>
            {"There is no dress code for senior portraits. You can show up in a suit, dress, or even your pajamas. We have even had students bring their instruments and pets. We recommend wearing something that you are comfortable being pictured in, since your image will likely be on shelves of your peers for decades to come."}
          </p>

          {/* Example Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <figure>
              <div className="relative aspect-square overflow-hidden rounded">
                <Image
                  src="/images/Senior_Pictures/232010911.JPG"
                  alt={"Informal attire example"}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <figcaption className="text-sm text-text-muted mt-3 text-center">
                {"Informal attire"}
              </figcaption>
            </figure>
            <figure>
              <div className="relative aspect-square overflow-hidden rounded">
                <Image
                  src="/images/Senior_Pictures/232198679.JPG"
                  alt={"Formal attire example"}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <figcaption className="text-sm text-text-muted mt-3 text-center">
                {"Formal attire"}
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Senior Discount Section */}
        <section className="section-tight container-text">
          <div className="divider-accent mb-6" />
          <h2 className="mb-4">{"Senior Discount"}</h2>
          <p>
            {"After your senior photo appointment, you will be able to order your yearbook for a special senior portrait only discounted price. This pricing only applies to seniors who attend their appointment."}
          </p>
          <p>
            {"If you do not wish to get your senior portrait, you are still able to pre-order your yearbook at the pre-order discounted price on our order page."}
          </p>
        </section>

        {/* Issues Section */}
        <section className="section-tight container-text">
          <div className="divider-accent mb-6" />
          <h2 className="mb-4">{"Missed Session or Issues?"}</h2>
          <p>
            For all questions regarding scheduling senior portrait sessions,
            late changes to biographical information, or any other issues,
            please contact{" "}
            <a
              href="mailto:tnq-exec@mit.edu"
              className="text-accent hover:text-accent-hover"
            >
              tnq-exec@mit.edu
            </a>
            . Technique has a publication deadline for senior portraits, so we
            unfortunately cannot accommodate any students who miss all scheduled
            senior portrait sessions. Rest assured that your name will appear in
            the yearbook in a section that does not feature senior portraits.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default SeniorsPage;
