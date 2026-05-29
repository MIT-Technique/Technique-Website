"use client";
import React from "react";
import Footer from "@/components/Footer/Footer";
export default function PrivacyPage() {
  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{"Privacy Policy"}</h1>
          <p className="text-sm text-text-muted">
            {"Last Updated: May 28, 2026"}
          </p>
        </section>

        {/* Privacy Policy Content */}
        <section className="section container-narrow">
          <div className="prose prose-lg max-w-none">
            {/* Information We Collect */}
            <div className="mb-8">
              <h2>{"Information We Collect"}</h2>
              <p>
                {
                  "We collect information that you provide directly to us and information automatically collected when you use our website."
                }
              </p>

              <h3>{"Personal Information (for MIT students only)"}</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>{"Name (first and last)"}</li>
                <li>{"MIT email address"}</li>
                <li>{"Academic major/course number"}</li>
                <li>{"Optional yearbook quote"}</li>
                <li>{"Senior portrait photographs"}</li>
              </ul>

              <h3>{"Cookies and Tracking"}</h3>
              <p>
                {
                  "We use cookies and similar technologies to enhance your experience:"
                }
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>{"Session cookies for authentication (MIT Touchstone)"}</li>
              </ul>
            </div>

            {/* How We Use Information */}
            <div className="mb-8">
              <h2>{"How We Use Your Information"}</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  {
                    "To include your information and photo in the MIT Technique yearbook"
                  }
                </li>
                <li>
                  {
                    "To communicate with you about yearbook orders, portrait sessions, and organization updates"
                  }
                </li>
                <li>
                  {
                    "To provide services such as event photography and invoice processing"
                  }
                </li>
                <li>{"To improve our website and user experience"}</li>
              </ul>
            </div>

            {/* Data Storage */}
            <div className="mb-8">
              <h2>{"Data Storage and Security"}</h2>
              <p>
                {
                  "Your personal information is stored securely in Supabase with industry-standard encryption. We retain senior bio information for yearbook publication purposes and historical archives. We implement reasonable security measures to protect your data, but no method of transmission over the internet is 100% secure."
                }
              </p>
            </div>

            {/* Third-Party Services */}
            <div className="mb-8">
              <h2>{"Third-Party Services"}</h2>
              <p>{"We use the following third-party services:"}</p>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  <strong>MIT Touchstone:</strong>{" "}
                  {
                    "For authentication using your MIT credentials (see MIT's privacy policy)"
                  }
                </li>
                <li>
                  <strong>Supabase:</strong> {"For secure database storage"}
                </li>
                <li>
                  <strong>Vercel:</strong>{" "}
                  {"For website hosting and deployment"}
                </li>
              </ul>
            </div>

            {/* Your Rights */}
            <div className="mb-8">
              <h2>{"Your Rights"}</h2>
              <p>{"You have the right to:"}</p>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  {"Access your personal information stored in our database"}
                </li>
                <li>{"Request correction of inaccurate information"}</li>
                <li>
                  {
                    "Request deletion of your information (subject to yearbook publication requirements)"
                  }
                </li>
                <li>
                  {
                    "Opt out of non-essential cookies by adjusting your browser settings"
                  }
                </li>
              </ul>
              <p>
                {
                  "To exercise these rights, please contact us at technique@mit.edu."
                }
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="mb-8">
              <h2>{"Children's Privacy"}</h2>
              <p>
                {
                  "Our services are intended for MIT students (typically 18 years or older). We do not knowingly collect information from individuals under 18 without parental consent."
                }
              </p>
            </div>

            {/* Changes to Policy */}
            <div className="mb-8">
              <h2>{"Changes to This Policy"}</h2>
              <p>
                {
                  "We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page with an updated 'Last Updated' date."
                }
              </p>
            </div>

            {/* Contact Information */}
            <div className="card bg-bg-secondary">
              <h2>{"Contact Us"}</h2>
              <p>
                {
                  "If you have questions about this privacy policy or our data practices, please contact us:"
                }
              </p>
              <p className="mt-4">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:technique@mit.edu"
                  className="text-accent hover:underline"
                >
                  tnq-exec@mit.edu
                </a>
                <br />
                <strong>{"Office:"}</strong> Walker Memorial, Room 50-320
                <br />
                <strong>{"Mailing Address:"}</strong> MIT Technique, 84
                Massachusetts Ave, Cambridge, MA 02139
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
