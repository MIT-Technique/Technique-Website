"use client";
import React from "react";
import Footer from '@/components/Footer/Footer';
import Image from "next/image";
function JoinPage() {

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{"Join Us"}</h1>
          <p className="text-lg text-text-secondary font-light">
            {"Become part of MIT's photography and yearbook tradition."}
          </p>
        </section>

        {/* Welcome Section */}
        <section className="section-tight container-text text-center">
          <div className="divider-accent mb-8 mx-auto" />
          <p className="text-lg mb-8">
            {"Technique welcomes students of all experience levels. Whether you're a beginner or experienced, there's a place for you in our community."}
          </p>
        </section>

        {/* Opportunities Section */}
        <section className="section bg-bg-secondary">
          <div className="container-text">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Photography */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{"Photography"}</h4>
                <p className="text-sm">
                  {"Join photo walks, attend camera workshops, and borrow equipment through our camera lending program. Learn photography hands-on while capturing MIT life."}
                </p>
              </div>

              {/* Design */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{"Design"}</h4>
                <p className="text-sm">
                  {"Work on graphic design and web design projects. Receive training in Adobe InDesign, Illustrator, and Photoshop while designing the yearbook and digital content."}
                </p>
              </div>

              {/* Business */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{"Business"}</h4>
                <p className="text-sm">
                  {"Help with outreach, event setup, and social media management. Organize events and build connections across the MIT community."}
                </p>
              </div>

              {/* Collaboration */}
              <div className="card">
                <div className="divider-accent mb-4" />
                <h4>{"Collaboration"}</h4>
                <p className="text-sm pb-0">
                  {"Work alongside passionate students from all backgrounds. Beginners are welcome—we provide training and mentorship to help you grow."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Past Work Section */}
        <section className="section container-text">
          <div className="text-center mb-12">
            <div className="divider-accent mb-8 mx-auto" />
            <h3 className="mb-4">{"Past Work"}</h3>
            <p className="text-lg text-text-secondary font-light">
              {"See examples of yearbook spreads designed by our team."}
            </p>
          </div>

          {/* Infinite Scroll Gallery */}
          <div className="overflow-hidden rounded">
            <div className="flex animate-scroll hover:pause-animation">
              {/* First set of images */}
              {[
                { src: '/images/design/Max Zhu/Activities.jpg', alt: 'Activities Spread' },
                { src: '/images/design/Max Zhu/Endgame.jpg', alt: 'Endgame Spread' },
                { src: '/images/design/Max Zhu/Journal.jpg', alt: 'Journal Spread' },
                { src: '/images/design/Max Zhu/LIH.jpg', alt: 'LIH Spread' },
                { src: '/images/design/Max Zhu/Living Groups.jpg', alt: 'Living Groups Spread' },
                { src: '/images/design/Max Zhu/Seniors.jpg', alt: 'Seniors Spread' },
                { src: '/images/design/Max Zhu/Sports.jpg', alt: 'Sports Spread' },
              ].map((image, index) => (
                <div key={index} className="relative w-48 h-64 flex-shrink-0 overflow-hidden rounded group mx-1.5">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill={true}
                    sizes="192px"
                    style={{ objectFit: "contain" }}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {[
                { src: '/images/design/Max Zhu/Activities.jpg', alt: 'Activities Spread' },
                { src: '/images/design/Max Zhu/Endgame.jpg', alt: 'Endgame Spread' },
                { src: '/images/design/Max Zhu/Journal.jpg', alt: 'Journal Spread' },
                { src: '/images/design/Max Zhu/LIH.jpg', alt: 'LIH Spread' },
                { src: '/images/design/Max Zhu/Living Groups.jpg', alt: 'Living Groups Spread' },
                { src: '/images/design/Max Zhu/Seniors.jpg', alt: 'Seniors Spread' },
                { src: '/images/design/Max Zhu/Sports.jpg', alt: 'Sports Spread' },
              ].map((image, index) => (
                <div key={`dup-${index}`} className="relative w-48 h-64 flex-shrink-0 overflow-hidden rounded group mx-1.5">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill={true}
                    sizes="192px"
                    style={{ objectFit: "contain" }}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
          <style jsx>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .animate-scroll {
              animation: scroll 40s linear infinite;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
          `}</style>
        </section>

        {/* CTA Section */}
        <section className="section-tight container-text text-center">
          <div className="divider-accent mb-8 mx-auto" />
          <a
            href="mailto:technique@mit.edu?subject=Joining%20Technique"
            className="btn-primary"
          >
            {"Get Involved"}
          </a>
          <p className="text-sm text-text-muted mt-4">
            {"Email us to learn about joining Technique"}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default JoinPage;
