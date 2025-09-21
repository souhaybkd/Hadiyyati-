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
      'Yes — you can add links, describe gift ideas, or request a simple cash gift.',
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
    question: 'Is Hadiyati safe?',
    answer:
      'Yes — all payments are secure, and your personal data is protected.',
  },
]

export function FAQ() {
  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-design-h2 font-bold mb-6 text-design-text-heading">
            FAQs
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-design-gray-200">
                <AccordionTrigger className="text-design-body font-semibold text-left text-design-text-heading hover:text-design-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-design-text-muted text-design-body">
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