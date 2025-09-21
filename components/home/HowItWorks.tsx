'use client'

import React from 'react'
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

export function HowItWorks() {
  const steps = [
    {
      step: 1,
      icon: UserPlus,
      title: 'Create Your Account',
      description: 'Sign up in seconds with your email or Google account. Choose your unique username.',
      details: ['Free registration', 'Secure & private', 'Custom URL'],
    },
    {
      step: 2,
      icon: ListPlus,
      title: 'Build Your Wishlist',
      description: 'Add items you love from any website, set prices, and organize everything beautifully.',
      details: ['Add from any website', 'Set gift priorities', 'Rich descriptions & images'],
    },
    {
      step: 3,
      icon: Share2,
      title: 'Share Your Link',
      description: 'Share your personalized wishlist link on social media, messaging apps, or anywhere.',
      details: ['Beautiful sharing page', 'Mobile optimized', 'Social media ready'],
    },
    {
      step: 4,
      icon: Gift,
      title: 'Receive Amazing Gifts',
      description: 'Friends and family can see your wishes and send you exactly what you want.',
      details: ['Secure payments', 'Real-time notifications', 'Thank you messages'],
    },
  ]

  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="text-center mb-16">
          <h2 className="text-design-h2 font-bold mb-6 text-design-text-heading">
            How It Works
          </h2>
          <p className="text-design-body text-design-text-muted max-w-2xl mx-auto">
            Getting started with Hadiyati is simple. Follow these four easy steps 
            to create your wishlist and start receiving meaningful gifts.
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
              
              <Card className="relative z-10 shadow-design-card hover:shadow-design-card-hover transition-design text-center h-full">
                <CardContent className="p-8">
                  {/* Step number */}
                  <div className="w-12 h-12 bg-design-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 text-lg font-bold">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 bg-design-primary/10 rounded-design-card flex items-center justify-center mx-auto mb-6">
                    <step.icon className="h-8 w-8 text-design-primary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-design-h3 font-semibold mb-4 text-design-text-heading">
                    {step.title}
                  </h3>
                  <p className="text-design-text-muted mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Details */}
                  <ul className="space-y-2 text-left">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center text-design-small text-design-text-muted">
                        <CheckCircle className="h-4 w-4 text-design-secondary mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">

          <Button size="lg" className="px-8 py-6 text-lg group shadow-design-card">
            Create Your Wishlist Now
            <ArrowRight className="ml-2 h-5 w-5 transition-design group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  )
} 