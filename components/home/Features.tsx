'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight,
  PackagePlus,
  CreditCard,
  Wallet,
  LayoutDashboard,
  Heart,
  Share2,
  Smartphone,
  Globe,
  Zap
} from 'lucide-react'

export function Features() {
  const mainFeatures = [
    {
      icon: PackagePlus,
      title: 'Easy Wishlist Creation',
      description: 'Add items from any website with our browser extension or manually create beautiful wish items.',
      color: 'text-design-primary',
      bgColor: 'bg-design-primary/10',
    },
    {
      icon: Share2,
      title: 'Effortless Sharing',
      description: 'Share your wishlist anywhere with a beautiful, mobile-optimized link that works everywhere.',
      color: 'text-design-secondary',
      bgColor: 'bg-design-secondary/10',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Accept payments safely through our integrated payment system with fraud protection.',
      color: 'text-design-primary',
      bgColor: 'bg-design-primary/10',
    },
    {
      icon: LayoutDashboard,
      title: 'Smart Dashboard',
      description: 'Track gifts, manage your wishlist, and see analytics all from your personalized dashboard.',
      color: 'text-design-secondary',
      bgColor: 'bg-design-secondary/10',
    },
  ]

  const additionalFeatures = [
    { icon: Heart, text: 'Favorites & Priority Levels' },
    { icon: Smartphone, text: 'Mobile-First Design' },
    { icon: Globe, text: 'Multi-Language Support' },
    { icon: Zap, text: 'Real-Time Notifications' },
    { icon: Wallet, text: 'Multiple Payment Options' },
    { icon: PackagePlus, text: 'Unlimited Items (Pro)' },
  ]

  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-design-h2 font-bold mb-6 text-design-text-heading">
            Everything You Need for Perfect Gift-Giving
          </h2>
          <p className="text-design-text-muted text-design-body mb-4">
            From creating beautiful wishlists to receiving meaningful gifts, 
            our platform provides all the tools you need for seamless gift experiences.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {mainFeatures.map((feature, index) => (
            <Card key={index} className="shadow-design-card hover:shadow-design-card-hover transition-design group border border-design-primary">
              <CardContent className="p-4  ">
                <div className={`w-16 h-16 ${feature.bgColor} rounded-design-card flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-design-h3 font-semibold mb-4 text-design-text-heading">
                  {feature.title}
                </h3>
                <p className="text-design-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>





        {/* Demo Section */}
        <div className="text-center">
          <h3 className="text-design-h3 font-semibold mb-6 text-design-text-heading">
            See It In Action
          </h3>
          <div className="bg-design-gray-100 rounded-design-image aspect-video flex items-center justify-center mb-8 overflow-hidden border border-design-primary/20 shadow-design-card">
            <img 
              src="/assets/img/dashboard.png" 
              alt="Hadiaytti Dashboard Preview showing wishlist management, settings, and mobile preview" 
              className="w-full h-full object-contain rounded-design-image"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <Button asChild size="lg" className="group">
              <Link href="/auth">
                Start for Free
                <ArrowRight className="ml-2 h-4 w-4 transition-design group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 