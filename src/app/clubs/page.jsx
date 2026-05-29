"use client";
import React from "react";
import Footer from '@/components/Footer/Footer';
function ActivitiesPage() {

  const googleFormUrl = "https://forms.gle/QcimcHbfVc77tzWM9";

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{"Clubs Form"}</h1>
          <p className="text-lg text-text-secondary font-light">
            {"Submit information about your club or organization for potential yearbook coverage."}
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
            {"Submit Club"}
          </a>
          <p className="text-sm text-text-muted mt-4">
            {"Complete the form to submit your club information and photos"}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default ActivitiesPage;
