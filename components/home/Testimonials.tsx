'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Quote } from 'lucide-react'

export function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Content Creator',
      company: '@sarahcreates',
      avatar: 'SC',
      rating: 5,
      content: 'Hadiyati has completely transformed how I receive gifts from my community. The interface is beautiful, and my fans love how easy it is to support me with meaningful gifts.',
      color: 'bg-design-primary',
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      role: 'Wedding Planner',
      company: 'Elite Events',
      avatar: 'MR',
      rating: 5,
      content: 'I recommend Hadiyati to all my couples. It makes wedding gift registries so much more personal and elegant. The couple gets exactly what they want, and guests love the experience.',
      color: 'bg-design-secondary',
    },
    {
      id: 3,
      name: 'Emma Thompson',
      role: 'New Mom',
      company: 'Family of 3',
      avatar: 'ET',
      rating: 5,
      content: 'Creating a baby registry with Hadiyati was amazing. Friends and family could see exactly what we needed, and we received so many thoughtful gifts. The thank you feature is perfect!',
      color: 'bg-design-accent',
    },
    {
      id: 4,
      name: 'David Park',
      role: 'Student',
      company: 'MIT',
      avatar: 'DP',
      rating: 5,
      content: 'As a college student, Hadiyati helps me share my wishlist with family for birthdays and holidays. They finally know what to get me, and I receive gifts I actually want and need.',
      color: 'bg-design-primary',
    },
  ]

  return (
    <div className="design-section-spacing bg-design-light">
      <div className="design-container">
        <div className="text-center mb-16">
          <h2 className="text-design-h2 font-bold mb-6 text-design-text-heading">
            Loved by Thousands of Users
          </h2>
          <p className="text-design-body text-design-text-muted max-w-2xl mx-auto">
            See what our community is saying about their experience with Hadiyati.
            Real stories from real people who've transformed their gift-giving.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.id} className="shadow-design-card hover:shadow-design-card-hover transition-design">
              <CardContent className="p-8">
                {/* Quote Icon */}
                <div className="flex justify-between items-start mb-6">
                  <Quote className="h-8 w-8 text-design-primary/20" />
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-design-secondary text-design-secondary" />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <p className="text-design-text-body mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold mr-4`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-design-text-heading">
                      {testimonial.name}
                    </h4>
                    <p className="text-design-text-muted text-design-small">
                      {testimonial.role} • {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white rounded-design-card p-6 shadow-design-light">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-6 w-6 text-design-secondary mr-2 fill-current" />
              <span className="text-2xl font-bold text-design-text-heading">4.9</span>
            </div>
            <p className="text-design-text-muted text-design-small">
              Average Rating
            </p>
          </div>
          <div className="bg-white rounded-design-card p-6 shadow-design-light">
            <div className="text-2xl font-bold text-design-text-heading mb-2">
              10,000+
            </div>
            <p className="text-design-text-muted text-design-small">
              Happy Users
            </p>
          </div>
          <div className="bg-white rounded-design-card p-6 shadow-design-light">
            <div className="text-2xl font-bold text-design-text-heading mb-2">
              50,000+
            </div>
            <p className="text-design-text-muted text-design-small">
              Gifts Shared
            </p>
          </div>
        </div>


      </div>
    </div>
  )
} 