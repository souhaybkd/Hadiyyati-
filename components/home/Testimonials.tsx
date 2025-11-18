'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'

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
          <h2 className="text-design-h2 font-bold mb-6 text-design-primary">
            Loved by Thousands of Users
          </h2>
          <p className="text-design-body text-design-primary max-w-2xl mx-auto">
            See what our community is saying about their experience with Hadiyati.
            Real stories from real people who've transformed their gift-giving.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.id} className="relative z-10 p-[10px] rounded-lg lg:rounded-[64px]" style={{ background: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
              <Card className="shadow-design-card hover:shadow-design-card-hover transition-design border-0 rounded-lg lg:rounded-[64px] bg-design-primary h-full">
                <CardContent className="p-8 text-center">
                  {/* Stars - Centered */}
                  <div className="flex justify-center space-x-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-design-secondary text-design-secondary" />
                    ))}
                  </div>

                  {/* Content - Centered */}
                  <p className="text-white mb-6 leading-relaxed italic text-center">
                    "{testimonial.content}"
                  </p>

                  {/* Author - Centered */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold mb-3`}>
                      {testimonial.avatar}
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold text-white">
                        {testimonial.name}
                      </h4>
                      <p className="text-white/80 text-design-small">
                        {testimonial.role} • {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
          <div className="rounded-design-card p-6 shadow-design-light text-white" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
            <div className="flex items-center justify-center mb-2">
              <Star className="h-6 w-6 text-white mr-2 fill-white" />
              <span className="text-2xl font-bold text-white">4.9</span>
            </div>
            <p className="text-white text-design-small">
              Average Rating
            </p>
          </div>
          <div className="rounded-design-card p-6 shadow-design-light text-white" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
            <div className="text-2xl font-bold text-white mb-2">
              10,000+
            </div>
            <p className="text-white text-design-small">
              Happy Users
            </p>
          </div>
          <div className="rounded-design-card p-6 shadow-design-light text-white" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
            <div className="text-2xl font-bold text-white mb-2">
              50,000+
            </div>
            <p className="text-white text-design-small">
              Gifts Shared
            </p>
          </div>
        </div>


      </div>
    </div>
  )
} 