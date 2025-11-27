'use client'

import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Can I request both physical and digital gifts?',
    answer:
      'At this time you may only receive digital gifts',
  },
  {
    question: 'Is it free to use?',
    answer: 'Yes — creating and sharing your Hadiyati is completely free.',
  },
  {
    question: 'How do I receive gift money?',
    answer:
      'You can choose from payout methods like local bank transfer, TapTap Send, or Western Union.',
  },
  {
    question: 'Is Hadiyyati safe?',
    answer:
      'Yes — all payments are secure, and your personal data is protected.',
  },
]

export function FAQ() {
  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-design-h2 font-bold mb-6 text-design-secondary">
            FAQs
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="!border-2 !border-design-secondary rounded-lg px-4 py-2 !border-b-2">
                <AccordionTrigger className="text-design-body font-semibold text-left text-design-primary hover:text-design-primary">
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