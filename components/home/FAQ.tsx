'use client'

import React from 'react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export function FAQ() {
  const { t } = useLanguage()
  const faqs = [
    { question: t('home.faq.q1'), answer: t('home.faq.a1') },
    { question: t('home.faq.q2'), answer: t('home.faq.a2') },
    { question: t('home.faq.q3'), answer: t('home.faq.a3') },
    { question: t('home.faq.q4'), answer: t('home.faq.a4') },
  ]

  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-design-h2 font-bold mb-6 text-design-secondary">
            {t('home.faq.title')}
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="!border-2 !border-design-secondary rounded-lg px-4 py-2 !border-b-2">
                <AccordionTrigger className="text-design-body font-semibold text-start text-design-primary hover:text-design-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-design-primary text-design-body">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  )
}
