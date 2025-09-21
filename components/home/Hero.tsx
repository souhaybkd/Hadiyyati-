'use client'

import React from 'react'
import Link from 'next/link'
import Lottie from "lottie-react";
import giftAnimation from '@/assets/lottie/gift.json'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Star, Users, Gift, Shield, Play } from 'lucide-react'

export function Hero() {
  return (
    <div className="relative isolate min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-design-light to-design-gray-100">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 opacity-20 min-h-screen" style={{
        maskImage: 'linear-gradient(0deg, white, rgba(255, 255, 255, 0.6))',
        WebkitMaskImage: 'linear-gradient(0deg, white, rgba(255, 255, 255, 0.6))'
      }}></div>
      
      <div className="text-center relative z-10 design-container py-20">
        <div className="max-w-5xl mx-auto px-4">
          
          {/* Trust badge */}
          <Badge className="mb-4 px-4 py-2 text-primary border border-primary">
            <Star className="h-4 w-4 mr-2 fill-current text-white" />
            Trusted by 10,000+ users worldwide
          </Badge>
          
          {/* Main heading */}
          <h1 className="text-design-h1 font-bold mb-4 text-design-text-heading leading-tight">
            All your gift wishes.
            <br />
            <span className="text-design-primary">One beautiful link.</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl mb-6 text-design-text-muted max-w-3xl mx-auto leading-relaxed">
            Create a stunning wishlist, share it effortlessly, and receive meaningful gifts from loved ones. 
            The modern way to celebrate life's special moments.
          </p>

          {/* <div className="w-full max-w-xs mx-auto mb-8">
            <Lottie animationData={giftAnimation} loop={true} />
          </div> */}

          {/* URL Preview */}
          <div className="inline-flex items-center gap-2 font-mono text-design-text-muted bg-white rounded-design-card px-6 py-4 mb-12 shadow-design-card border border-design-gray-200">
            <span className="text-design-text-body">hadiyati.com/</span>
            <span className="text-design-primary font-semibold">yourname</span>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button asChild size="lg" className="group shadow-design-card px-8 py-6 text-lg">
              <Link href="/auth">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5 transition-design group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg group">
              <Link href="#demo">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-design-primary mr-2" />
                <span className="text-2xl font-bold text-design-text-heading">10K+</span>
              </div>
              <p className="text-design-text-muted text-design-small">Active Users</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Gift className="h-6 w-6 text-design-secondary mr-2" />
                <span className="text-2xl font-bold text-design-text-heading">50K+</span>
              </div>
              <p className="text-design-text-muted text-design-small">Gifts Shared</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-design-primary mr-2" />
                <span className="text-2xl font-bold text-design-text-heading">100%</span>
              </div>
              <p className="text-design-text-muted text-design-small">Secure & Private</p>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
} 