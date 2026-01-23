"use client";
import React, { useState } from "react";
import Footer from "../../../components/Footer/Footer";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslations } from 'next-intl';

function ResourcesPage() {
  const t = useTranslations('resources');
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqSections = [
    {
      id: 'accounts',
      title: t('faq.accounts.title'),
      questions: [
        { q: t('faq.accounts.q1'), a: t('faq.accounts.a1') },
        { q: t('faq.accounts.q2'), a: t('faq.accounts.a2') },
        { q: t('faq.accounts.q3'), a: t('faq.accounts.a3') },
        { q: t('faq.accounts.q4'), a: t('faq.accounts.a4') },
      ],
    },
    {
      id: 'yearbook',
      title: t('faq.yearbook.title'),
      questions: [
        { q: t('faq.yearbook.q1'), a: t('faq.yearbook.a1') },
        { q: t('faq.yearbook.q2'), a: t('faq.yearbook.a2') },
        { q: t('faq.yearbook.q3'), a: t('faq.yearbook.a3') },
      ],
    },
    {
      id: 'clubs',
      title: t('faq.clubs.title'),
      questions: [
        { q: t('faq.clubs.q1'), a: t('faq.clubs.a1') },
        { q: t('faq.clubs.q2'), a: t('faq.clubs.a2') },
        { q: t('faq.clubs.q3'), a: t('faq.clubs.a3') },
      ],
    },
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section container-text">
          <div className="text-center mb-12">
            <h1 className="mb-4">{t('title')}</h1>
            <p className="text-text-secondary">{t('description')}</p>
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
                      boxShadow: 'none',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px !important',
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': {
                        margin: 0,
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: '#750014' }} />}
                      sx={{
                        '&.Mui-expanded': {
                          minHeight: 48,
                        },
                        '& .MuiAccordionSummary-content.Mui-expanded': {
                          margin: '12px 0',
                        },
                      }}
                    >
                      <span className="text-sm font-medium">{item.q}</span>
                    </AccordionSummary>
                    <AccordionDetails
                      sx={{
                        borderTop: '1px solid #E5E5E5',
                        pt: 2,
                      }}
                    >
                      <p className="text-sm text-text-secondary leading-relaxed">
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
            <h3 className="text-lg font-medium mb-2">{t('faq.contact.title')}</h3>
            <p className="text-text-secondary text-sm mb-4">
              {t('faq.contact.description')}
            </p>
            <a
              href="mailto:technique@mit.edu"
              className="btn-primary inline-block"
            >
              {t('faq.contact.button')}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default ResourcesPage;
