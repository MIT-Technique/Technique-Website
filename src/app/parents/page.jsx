"use client";
import React from "react";
import Footer from "@/components/Footer/Footer";
import Link from "next/link";

function ParentsPage() {
  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{"Parents"}</h1>
          <p className="text-lg text-text-secondary font-light">
            {"Thank you for supporting your student and MIT Technique."}
          </p>
        </section>

        {/* Info Section */}
        <section className="section-tight bg-bg-secondary">
          <div className="container-text">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Preorder Card */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{"Preorder Yearbooks"}</h4>
                <p className="text-sm pb-4">
                  {
                    "Preorder yearbooks at a discounted price before the release date."
                  }
                </p>
                <Link
                  href={`/purchase`}
                  className="btn-primary inline-block"
                  disabled
                >
                  {"Preorder Now"}
                </Link>
              </div>

              {/* Inquiries Card */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{"Questions or Issues?"}</h4>
                <p className="text-sm pb-4">
                  {
                    "For inquiries about parent ads, purchasing older yearbooks, delivery issues, or other questions, please use our inquiry form or email us."
                  }
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/parent-inquiry`}
                    className="btn-secondary inline-block hover:!bg-accent hover:!border-accent"
                  >
                    {"Inquiry Form"}
                  </Link>
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

export default ParentsPage;
