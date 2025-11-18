'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Clock, 
  Heart, 
  Zap, 
  Users, 
  Gift, 
  Smartphone,
  Shield,
  Sparkles,
  XCircle,
  CheckCircle,
} from 'lucide-react'

export function Benefits() {
  const benefits = [
    {
      icon: Clock,
      title: 'Save Time & Effort',
      description: 'No more guessing what people want. Your wishlist tells them exactly what would make you happy.',
      stats: '90% less time spent on gift exchanges',
      color: 'text-design-primary',
      bgColor: 'bg-design-primary/10',
    },
    {
      icon: Heart,
      title: 'Meaningful Connections',
      description: 'Strengthen relationships through thoughtful gift-giving that shows you truly care.',
      stats: '95% satisfaction rate from recipients',
      color: 'text-design-secondary',
      bgColor: 'bg-design-secondary/10',
    },
    {
      icon: Zap,
      title: 'Instant Gratification',
      description: 'Real-time notifications when someone views or purchases from your wishlist.',
      stats: 'Updates in under 30 seconds',
      color: 'text-design-primary',
      bgColor: 'bg-design-primary/10',
    },
    {
      icon: Users,
      title: 'Social Sharing Made Easy',
      description: 'Share across all platforms with beautiful, mobile-optimized pages that work everywhere.',
      stats: 'Works on 100+ platforms',
      color: 'text-design-secondary',
      bgColor: 'bg-design-secondary/10',
    },
  ]

  const quickBenefits = [
    { icon: Gift, text: 'Get gifts you actually want' },
    { icon: Smartphone, text: 'Mobile-first experience' },
    { icon: Shield, text: 'Secure & private' },
    { icon: Sparkles, text: 'Beautiful design' },
  ]

  const beforeItems = [
    'Guessing what people want',
    'Receiving duplicate gifts',
    'Awkward gift exchanges',
    'Wasted time shopping',
    'Disappointed recipients',
  ]

  const afterItems = [
    'Know exactly what they want',
    'Perfect, meaningful gifts every time',
    'Seamless gift-giving experience',
    'Save time and money',
    'Happy recipients and givers',
  ]

  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="text-center mb-16">
          <h2 className="text-design-h2 font-bold mb-6 text-design-primary">
            Why Choose Hadiyati?
          </h2>
          <p className="text-design-body text-design-primary max-w-3xl mx-auto">
            Transform your gift-giving experience with features designed to make every 
            occasion special, meaningful, and stress-free for everyone involved.
          </p>
        </div>

        {/* Main Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="relative z-10 p-[10px] rounded-lg lg:rounded-[64px]" style={{ background: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
              <Card className="shadow-design-card hover:shadow-design-card-hover transition-design group border-0 rounded-lg lg:rounded-[64px] bg-design-primary h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-8">
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
                        <span className="text-design-small font-medium text-white">
                          {benefit.stats}
                        </span>
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