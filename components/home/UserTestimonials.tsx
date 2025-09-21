'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  {
    quote: 'My guests used Hadiyati to send all our wedding gifts. It was perfect.',
    author: 'Rana & Fadi',
    location: 'Beirut',
  },
  {
    quote: 'I shared my wishlist on Instagram and had everything I needed by my birthday.',
    author: 'Zaina',
    location: 'Dubai',
  },
  {
    quote: 'It works great on mobile and feels super personal.',
    author: 'Omar',
    location: 'Cairo',
  },
]

export function UserTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0
    const newIndex = isFirstSlide ? testimonials.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
  }

  const goToNext = () => {
    const isLastSlide = currentIndex === testimonials.length - 1
    const newIndex = isLastSlide ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
  }

  return (
    <div className="design-section-spacing bg-design-light">
      <div className="design-container">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-design-h2 font-bold mb-6 text-design-text-heading">
            From our users
          </h2>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <Card className="mb-8 shadow-design-card">
            <CardContent className="p-8 text-center">
              <blockquote className="text-design-body text-design-text-body mb-6 italic">
                "{testimonials[currentIndex].quote}"
              </blockquote>
              <div className="text-design-text-muted">
                <div className="font-semibold text-design-text-heading">
                  {testimonials[currentIndex].author}
                </div>
                <div className="text-design-small">
                  {testimonials[currentIndex].location}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-design ${
                    index === currentIndex 
                      ? 'bg-design-primary' 
                      : 'bg-design-gray-300'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 