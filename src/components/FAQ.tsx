'use client'

import { Accordion, AccordionTab } from 'primereact/accordion'
import React, { useMemo } from 'react'
import { FAQ_DATA } from '@/constants/faq'

interface FAQProps {
  t: (key: string) => string
}

const FAQHeader = React.memo(function FAQHeader({ t }: { t: (key: string) => string }) {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <i className="pi pi-question-circle text-white text-xl"></i>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">{t('faq.title')}</h2>
      </div>
      <p className="text-gray-600 text-lg max-w-2xl mx-auto">{t('faq.subtitle')}</p>
    </div>
  )
})

const FAQCallToAction = React.memo(function FAQCallToAction({ t }: { t: (key: string) => string }) {
  return (
    <div className="text-center mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-500">
      <h3 className="font-semibold text-gray-900 mb-2">{t('faq.cta.title')}</h3>
      <p className="text-gray-600 text-sm">{t('faq.cta.description')}</p>
    </div>
  )
})

export const FAQ = React.memo(function FAQ({ t }: FAQProps) {
  const faqItems = useMemo(
    () =>
      FAQ_DATA.map((faq) => (
        <AccordionTab
          key={faq.id}
          header={
            <span className="font-semibold text-gray-900">
              {t(`faq.questions.${faq.id}.question`)}
            </span>
          }
        >
          <div className="text-gray-600 leading-relaxed p-4">
            {t(`faq.questions.${faq.id}.answer`)
              .split('\n')
              .map((paragraph, idx) => (
                <p key={`${faq.id}-p-${idx}`} className={idx > 0 ? 'mt-3' : ''}>
                  {paragraph.trim()}
                </p>
              ))}
          </div>
        </AccordionTab>
      )),
    [t]
  )
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <FAQHeader t={t} />

        {/* Accordion */}
        <div className="max-w-4xl mx-auto">
          <Accordion multiple className="faq-accordion">
            {faqItems}
          </Accordion>
        </div>

        <FAQCallToAction t={t} />
      </div>

      <style jsx>{`
        :global(.faq-accordion .p-accordion-tab) {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        :global(.faq-accordion .p-accordion-header) {
          border: none;
          border-radius: 0.75rem;
          background: #f9fafb;
        }
        :global(.faq-accordion .p-accordion-header:hover) {
          background: #f3f4f6;
        }
        :global(.faq-accordion .p-accordion-header.p-highlight) {
          background: #eff6ff;
          border-color: #3b82f6;
        }
        :global(.faq-accordion .p-accordion-content) {
          border: none;
          background: white;
          padding: 0 !important;
        }
        :global(.faq-accordion .p-accordion-toggle-icon) {
          color: #6b7280;
        }
        :global(.faq-accordion .p-accordion-header.p-highlight .p-accordion-toggle-icon) {
          color: #3b82f6;
        }
      `}</style>
    </section>
  )
})
