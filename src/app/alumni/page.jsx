"use client";
import React from "react";
import Footer from '@/components/Footer/Footer';
import Link from "next/link";

function AlumniPage() {

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{"Alumni"}</h1>
          <p className="text-lg text-text-secondary font-light">
            {"Relive your MIT memories through Technique."}
          </p>
        </section>

        {/* MIT Alumni Section */}
        <section className="section-tight bg-bg-secondary">
          <div className="container-text">
            <h2 className="text-sm uppercase tracking-widest text-text-muted mb-6">{"MIT Alumni"}</h2>
            <div className="card">
              <div className="divider-accent mb-4" />
              <h4>{"Get in Touch"}</h4>
              <p className="text-sm pb-4">
                {"Looking to purchase past yearbooks, inquire about alumni features, or reconnect with MIT? Reach out via our inquiry form."}
              </p>
              <Link
                href={`/alumni-inquiry`}
                className="btn-secondary inline-block hover:!bg-accent hover:!border-accent"
              >
                {"Inquiry Form"}
              </Link>
            </div>
          </div>
        </section>

        {/* Technique Alumni Section */}
        <section className="section-tight">
          <div className="container-text">
            <h2 className="text-sm uppercase tracking-widest text-text-muted mb-6">{"Technique Alumni"}</h2>
            <div className="card">
              <div className="divider-accent mb-4" />
              <h4>{"Visit Us"}</h4>
              <p className="text-sm pb-2">
                {"Welcome back to Technique! We'd love to reconnect with former staph members. Stop by to chat, flip through old yearbooks, or let us show you around. We're typically in Room 4-253 from 12-2pm on Saturdays."}
              </p>
              <p className="text-sm pb-4 text-text-secondary">
                {"Technique alumni can reach out directly via email to arrange a visit."}
              </p>
              <a
                href="mailto:technique@mit.edu?subject=Technique%20Alumni%20Visit"
                className="btn-secondary inline-block hover:!bg-accent hover:!border-accent"
              >
                {"Email Us"}
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
