'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Gift, Heart, Lock, MapPin, Wallet } from 'lucide-react'
import { useLanguage } from '@/lib/contexts/LanguageContext'

export function AboutContent() {
  const { t } = useLanguage()

  const steps = [
    { title: t('about.how1.title'), description: t('about.how1.desc') },
    { title: t('about.how2.title'), description: t('about.how2.desc') },
    { title: t('about.how3.title'), description: t('about.how3.desc') },
    { title: t('about.how4.title'), description: t('about.how4.desc') },
  ]

  const trustPoints = [
    { icon: Lock, title: t('about.trust1.title'), description: t('about.trust1.desc') },
    { icon: Heart, title: t('about.trust2.title'), description: t('about.trust2.desc') },
    { icon: Wallet, title: t('about.trust3.title'), description: t('about.trust3.desc') },
    { icon: MapPin, title: t('about.trust4.title'), description: t('about.trust4.desc') },
  ]

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto space-y-16">
        <section className="text-center">
          <p className="text-sm font-semibold tracking-wide uppercase text-design-primary mb-3">
            {t('about.kicker')}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-design-text-heading mb-4">
            {t('about.title')}
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-design-primary mb-6">
            {t('about.tagline')}
          </p>
          <div className="space-y-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            <p>{t('about.p1')}</p>
            <p>{t('about.p2')}</p>
            <p>{t('about.p3')}</p>
            <p>{t('about.p4')}</p>
            <p className="text-design-text-heading font-semibold">{t('about.p5')}</p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-design-text-heading mb-4">{t('about.whyTitle')}</h2>
          <div className="space-y-4 text-muted-foreground text-lg">
            <p>{t('about.why1')}</p>
            <p className="text-design-text-heading font-semibold">{t('about.why2')}</p>
            <p>{t('about.why3')}</p>
            <p>{t('about.why4')}</p>
            <p>{t('about.why5')}</p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-design-text-heading mb-8">{t('about.howTitle')}</h2>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <Card key={step.title} className="shadow-design-card">
                <CardContent className="p-6 flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-design-text-heading mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-muted-foreground">{t('about.fee')}</p>
        </section>

        <section className="rounded-2xl bg-design-primary text-white p-8 md:p-10">
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="h-6 w-6 shrink-0 mt-1" />
            <h2 className="text-3xl font-bold">{t('about.regionTitle')}</h2>
          </div>
          <div className="space-y-4 text-lg text-white/90">
            <p>{t('about.region1')}</p>
            <p>{t('about.region2')}</p>
            <p className="font-semibold text-white">{t('about.region3')}</p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-design-text-heading mb-4">{t('about.trustTitle')}</h2>
          <p className="text-lg text-muted-foreground mb-8">{t('about.trustIntro')}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {trustPoints.map((point) => (
              <Card key={point.title} className="shadow-design-card">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-full bg-design-primary/10 text-design-primary flex items-center justify-center mb-4">
                    <point.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-design-text-heading mb-2">{point.title}</h3>
                  <p className="text-muted-foreground">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-muted-foreground">
            {t('about.support')}{' '}
            <Link href="/contact" className="text-design-primary font-semibold hover:underline">
              {t('about.supportLink')}
            </Link>
          </p>
        </section>

        <section className="text-center rounded-2xl border p-8 md:p-12">
          <Gift className="h-10 w-10 mx-auto mb-4 text-design-primary" />
          <h2 className="text-3xl font-bold text-design-text-heading mb-4">{t('about.joinTitle')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">{t('about.joinBody')}</p>
          <p className="text-xl font-semibold text-design-text-heading mb-8">{t('about.joinTag')}</p>
          <Button
            asChild
            size="lg"
            className="px-8 py-6 text-lg group shadow-none rounded-full text-white font-semibold hover:opacity-90"
            style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)' }}
          >
            <Link href="/auth">
              {t('about.cta')}
              <ArrowRight className="ms-2 h-5 w-5 transition-design rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
