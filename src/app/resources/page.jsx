"use client";
import React, { useState } from "react";
import Footer from "@/components/Footer/Footer";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Link from "next/link";

function ResourcesPage() {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqSections = [
    {
      id: "yearbook",
      title: "Yearbook",
      questions: [
        {
          q: "When can I order the yearbook?",
          a: (
            <>
              Yearbooks are typically available for preorder in the spring
              semester. Check{" "}
              <Link
                href="/purchase"
                className="text-accent hover:text-accent-hover"
              >
                here
              </Link>{" "}
              for current availability and pricing.
            </>
          ),
        },
        {
          q: "How much does the yearbook cost?",
          a: "Preorder pricing is discounted compared to the regular price. Seniors who attend their portrait session receive an additional discount. Visit the Yearbook page for exact pricing.",
        },
        {
          q: "Can parents or alumni order yearbooks?",
          a: "Yes! Visit the Parents or Alumni pages for ordering information. You can also use our inquiry forms for questions about purchasing current or past editions.",
        },
        {
          q: "When is the yearbook released?",
          a: "The yearbook is released late spring. Preorder copies can be picked up on campus.",
        },
      ],
    },
    {
      id: "seniors",
      title: "Senior Portraits & Bios",
      questions: [
        {
          q: "How do I schedule a senior portrait?",
          a: 'Portrait sessions open on a rolling basis. Visit the Seniors page and click "Schedule Your Portrait" to book an available time slot.',
        },
        {
          q: "How do I submit my senior bio?",
          a: "Navigate to the Senior Bio page. You can enter your name, major, and an optional quote that will appear alongside your portrait in the yearbook.",
        },
        {
          q: "What if I missed my portrait session?",
          a: "Contact technique@mit.edu as soon as possible. Technique has a publication deadline, so late sessions cannot always be accommodated. Your name will still appear in the yearbook regardless.",
        },
      ],
    },
    {
      id: "organizations",
      title: "Clubs, Living Groups & Sports",
      questions: [
        {
          q: "How does my organization get featured in the yearbook?",
          a: "Each organization has a dashboard where you can add a description, member list, and candid photos. Log in with your organization credentials to access it.",
        },
        {
          q: "What kind of photos should we submit?",
          a: "Submit high-quality candid photos that show your organization in action. You can upload up to 3 images. A group shot is preferred, but other candids are also allowed.",
        },
        {
          q: "How do living groups schedule a photoshoot?",
          a: "Log in to your living group dashboard and use the booking tab to select an available time slot, or propose a new time for Technique staph to review.",
        },
      ],
    },
    {
      id: "general",
      title: "General",
      questions: [
        {
          q: "What is Technique?",
          a: "Technique is MIT's official photography and yearbook student organization. We have published an annual yearbook commemorating life at MIT since 1885.",
        },
        {
          q: "How can I join Technique?",
          a: "Everyone is welcome regardless of experience. Visit the Join Us page or come to our Saturday meetings at 12pm in room 4-253. We offer photography, design, and business opportunities.",
        },
        {
          q: "Can I hire Technique for event photography?",
          a: 'Yes! We offer event photography services for MIT-affiliated organizations and groups. Visit the Hire Us page or email us with the subject line "Event Photography Quote" to get started.',
        },
      ],
    },
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section container-text">
          <div className="text-center mb-12">
            <h1 className="mb-4">{"Frequently Asked Questions"}</h1>
            <p className="text-text-secondary">
              {
                "Find answers to common questions about the yearbook, senior portraits, and getting featured."
              }
            </p>
          </div>

          {/* FAQ Sections */}
          {faqSections.map((section) => (
            <div key={section.id} className="mb-8">
              <h2 className="text-lg font-medium mb-4">{section.title}</h2>
              <div className="space-y-2">
                {section.questions.map((item, index) => (
                  <Accordion
                    key={`${section.id}-${index}`}
                    expanded={expanded === `${section.id}-${index}`}
                    onChange={handleChange(`${section.id}-${index}`)}
                    sx={{
                      boxShadow: "none",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px !important",
                      "&:before": { display: "none" },
                      "&.Mui-expanded": {
                        margin: 0,
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "#750014" }} />}
                      sx={{
                        "&.Mui-expanded": {
                          minHeight: 48,
                        },
                        "& .MuiAccordionSummary-content.Mui-expanded": {
                          margin: "12px 0",
                        },
                      }}
                    >
                      <span className="text-sm font-medium">{item.q}</span>
                    </AccordionSummary>
                    <AccordionDetails
                      sx={{
                        borderTop: "1px solid #E5E5E5",
                        pt: 2,
                      }}
                    >
                      <p className="text-sm pb-0 text-text-secondary leading-relaxed">
                        {item.a}
                      </p>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </div>
            </div>
          ))}

          {/* Contact Section */}
          <div className="mt-12 text-center p-8 bg-bg-secondary rounded-lg">
            <h3 className="text-lg font-medium mb-2">
              {"Still have questions?"}
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              {"We're here to help. Reach out to us directly."}
            </p>
            <a
              href="mailto:technique@mit.edu"
              className="btn-primary inline-block"
            >
              {"Contact Us"}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default ResourcesPage;
