"use client";
import React from "react";
import Footer from '@/components/Footer/Footer';
function AboutPage() {

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Hero Section */}
        <section className="section-tight container-text text-center">
          <h1 className="mb-6">{"About Us"}</h1>
          <p className="text-lg lg:text-xl text-text-secondary font-light leading-relaxed">
            {"Since 1885, our staph have crafted a beautiful annual of photographs and prose commemorating each year at MIT."}
          </p>
        </section>

        {/* Main Content */}
        <section className="section-tight container-text">
          <p>
            {"We are MIT's photography, yearbook, and design student organization. Every year, our staph send off our 280 page annual to the publisher in February and release the book in May. As students and alumni of MIT, we take great care to showcase MIT in its truest form, candidly, at its best and at its worst. We know how tough the Institute can be, and we know how rewarding it is to get to the other side."}
          </p>
          <p>
            {"In addition to designing the MIT yearbook, Technique supports the campus photography community by providing equipment rentals and event photography services."}
          </p>
        </section>

        {/* Feature Cards */}
        <section className="section bg-bg-secondary">
          <div className="container-content">
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              {/* H.R.H. Grogo Card */}
              <div className="card">
                <div className="divider-accent mb-6" />
                <h3>{"H.R.H. Grogo"}</h3>
                <p>
                  {"If you hang around Technique often, you'll hear this name being tossed around. You'll also see his beautiful face on all our merch. This is because our mascot is a gorilla and his name is H.R.H. Grogo."}
                </p>
                <p>
                  {"\"But why?\" you ask. We don't know either, but H.R.H. Grogo has been there since the beginning, inscribed in the back of the very first Technique, and has been there ever since. We're not quite sure how or when he became a gorilla."}
                </p>
              </div>

              {/* Weekly Card */}
              <div className="card">
                <div className="divider-accent mb-6" />
                <h3>{"Weekly"}</h3>
                <p>
                  {"We hold regular meetings at 12pm on Saturday in 4-253. Anyone is welcome to attend. We have photographic equipment for borrowing and often teach various photography and design related seminars at this time."}
                </p>
                <p>
                  {"During book season, fall term through early spring term, we hold regular meetings during the week where the various editors of each Technique section come in and do work. This is the best time to get involved with the process of crafting a yearbook."}
                </p>
                <p>
                  {"We also enjoy going on photowalks and different photographic excursions from time to time!"}
                </p>
              </div>

              {/* staph Card */}
              <div className="card">
                <div className="divider-accent mb-6" />
                <h3>{"staph"}</h3>
                <p>
                  {"Many of our staph are part time (or full time) photographers and/or designers, as well as MIT students and alumni. Most of our staph are free of infection."}
                </p>
                <p>
                  {"It takes no experience to join Technique. Our dedicated staph are committed to helping everyone who's willing to learn, especially when it's about photography or design."}
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

export default AboutPage;
