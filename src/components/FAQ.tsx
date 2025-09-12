'use client'

import { Accordion, AccordionTab } from 'primereact/accordion'
import React from 'react'
import { FAQ_DATA } from '@/constants/faq'

export function FAQ() {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <i className="pi pi-question-circle text-white text-xl"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Questions fréquentes</h2>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur Lablr, la sécurité de vos données et l&apos;utilisation de
            l&apos;application.
          </p>
        </div>
        
        {/* Accordion */}
        <div className="max-w-4xl mx-auto">
          <Accordion multiple className="faq-accordion">
            {FAQ_DATA.map((faq) => (
              <AccordionTab
                key={faq.id}
                header={
                  <span className="font-semibold text-gray-900">
                    {faq.question}
                  </span>
                }
              >
                <div className="text-gray-600 leading-relaxed p-4">
                  {faq.answer.split('\n').map((paragraph, idx) => (
                    <p key={idx} className={idx > 0 ? 'mt-3' : ''}>
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              </AccordionTab>
            ))}
          </Accordion>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-500">
          <h3 className="font-semibold text-gray-900 mb-2">
            Une autre question ?
          </h3>
          <p className="text-gray-600 text-sm">
            N&apos;hésitez pas à nous contacter si vous ne trouvez pas la réponse à votre question.
          </p>
        </div>
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
}