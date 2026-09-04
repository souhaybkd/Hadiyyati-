'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  UserPlus, 
  ListPlus, 
  Share2, 
  Gift,
  ArrowRight,
  CheckCircle 
} from 'lucide-react'

import { useLanguage } from '@/lib/contexts/LanguageContext'

export function HowItWorks() {
  const { t } = useLanguage()
  const steps = [
    {
      step: 1,
      icon: UserPlus,
      title: t('home.how.step1.title'),
      description: t('home.how.step1.desc'),
      details: [t('home.how.step1.d1'), t('home.how.step1.d2'), t('home.how.step1.d3')],
    },
    {
      step: 2,
      icon: ListPlus,
      title: t('home.how.step2.title'),
      description: t('home.how.step2.desc'),
      details: [t('home.how.step2.d1'), t('home.how.step2.d2'), t('home.how.step2.d3')],
    },
    {
      step: 3,
      icon: Share2,
      title: t('home.how.step3.title'),
      description: t('home.how.step3.desc'),
      details: [t('home.how.step3.d1'), t('home.how.step3.d2'), t('home.how.step3.d3')],
    },
    {
      step: 4,
      icon: Gift,
      title: t('home.how.step4.title'),
      description: t('home.how.step4.desc'),
      details: [t('home.how.step4.d1'), t('home.how.step4.d2'), t('home.how.step4.d3')],
    },
  ]

  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="text-center mb-16">
          <h2 className="text-design-h2 font-bold mb-6 text-design-primary">
            {t('home.how.title')}
          </h2>
          <p className="text-design-body text-design-primary max-w-2xl mx-auto">
            {t('home.how.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-8 h-0.5 bg-design-gray-200 z-0">
                </div>
              )}
              
              <div className="relative z-10 p-[10px] rounded-lg lg:rounded-[64px]" style={{ background: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
                <Card className="shadow-design-card hover:shadow-design-card-hover transition-design text-center h-full bg-design-primary border-0 rounded-lg lg:rounded-[64px]">
                  <CardContent className="p-8">
                  {/* Step number */}
                  <div className="w-12 h-12 bg-white text-design-primary rounded-full flex items-center justify-center mx-auto mb-6 text-lg font-bold">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 bg-white/20 rounded-design-card flex items-center justify-center mx-auto mb-6">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-design-h3 font-semibold mb-4 text-white">
                    {step.title}
                  </h3>
                  <p className="text-white mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Details */}
                  <ul className="space-y-2 text-start">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center text-design-small text-white">
                        <CheckCircle className="h-4 w-4 text-white me-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="px-8 py-6 text-lg group shadow-none rounded-full text-white font-semibold hover:opacity-90" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
            <Link href="/auth">
              {t('home.how.cta')}
              <ArrowRight className="ms-2 h-5 w-5 transition-design group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 