'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight,
  PackagePlus,
  CreditCard,
  LayoutDashboard,
  Share2,
} from 'lucide-react'

import { useLanguage } from '@/lib/contexts/LanguageContext'

export function Features() {
  const { t } = useLanguage()
  const mainFeatures = [
    {
      icon: PackagePlus,
      title: t('home.features.f1.title'),
      description: t('home.features.f1.desc'),
    },
    {
      icon: Share2,
      title: t('home.features.f2.title'),
      description: t('home.features.f2.desc'),
    },
    {
      icon: CreditCard,
      title: t('home.features.f3.title'),
      description: t('home.features.f3.desc'),
    },
    {
      icon: LayoutDashboard,
      title: t('home.features.f4.title'),
      description: t('home.features.f4.desc'),
    },
  ]

  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-design-h2 font-bold mb-6 text-design-primary">
            {t('home.features.title')}
          </h2>
          <p className="text-design-primary text-design-body mb-4">
            {t('home.features.subtitle')}
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {mainFeatures.map((feature, index) => (
            <div key={index} className="relative z-10 p-[10px] rounded-lg lg:rounded-[64px]" style={{ background: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
              <Card className="shadow-design-card hover:shadow-design-card-hover transition-design group border-0 rounded-lg lg:rounded-[64px] bg-design-primary h-full">
                <CardContent className="p-4">
                  <div className="w-16 h-16 bg-white/20 rounded-design-card flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-design-h3 font-semibold mb-4 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-white leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>





        {/* Demo Section */}
        <div className="text-center">
          <h3 className="text-design-h3 font-semibold mb-6 text-design-primary">
            {t('home.features.demo')}
          </h3>
          <div className="bg-design-gray-100 rounded-design-image aspect-video flex items-center justify-center mb-8 overflow-hidden border border-design-primary/20 shadow-design-card">
            <img 
              src="/assets/img/dashboard.png" 
              alt="hadiyyati Dashboard Preview showing wishlist management, settings, and mobile preview" 
              className="w-full h-full object-contain rounded-design-image"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <Button asChild size="lg" className="px-8 py-6 text-lg group shadow-none rounded-full text-white font-semibold hover:opacity-90" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
              <Link href="/auth">
                {t('home.features.cta')}
                <ArrowRight className="ms-2 h-4 w-4 transition-design group-hover:translate-x-1 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 