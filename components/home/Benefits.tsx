'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Clock, 
  Heart, 
  Zap, 
  Users, 
} from 'lucide-react'

import { useLanguage } from '@/lib/contexts/LanguageContext'

export function Benefits() {
  const { t } = useLanguage()
  const benefits = [
    {
      icon: Clock,
      title: t('home.benefits.b1.title'),
      description: t('home.benefits.b1.desc'),
    },
    {
      icon: Heart,
      title: t('home.benefits.b2.title'),
      description: t('home.benefits.b2.desc'),
    },
    {
      icon: Zap,
      title: t('home.benefits.b3.title'),
      description: t('home.benefits.b3.desc'),
    },
    {
      icon: Users,
      title: t('home.benefits.b4.title'),
      description: t('home.benefits.b4.desc'),
    },
  ]

  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="text-center mb-16">
          <h2 className="text-design-h2 font-bold mb-6 text-design-primary">
            {t('home.benefits.title')}
          </h2>
          <p className="text-design-body text-design-primary max-w-3xl mx-auto">
            {t('home.benefits.subtitle')}
          </p>
        </div>

        {/* Main Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="relative z-10 p-[10px] rounded-lg lg:rounded-[64px]" style={{ background: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
              <Card className="shadow-design-card hover:shadow-design-card-hover transition-design group border-0 rounded-lg lg:rounded-[64px] bg-design-primary h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-8">
                    <div className="w-16 h-16 bg-white/20 rounded-design-card flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <benefit.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-design-h3 font-semibold mb-3 text-white">
                        {benefit.title}
                      </h3>
                      <p className="text-white leading-relaxed mb-4">
                        {benefit.description}
                      </p>
                      <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full">
                        {/* <span className="text-design-small font-medium text-white">
                          {benefit.stats}
                        </span> */}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>




      </div>
    </div>
  )
} 