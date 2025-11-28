'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, MessageSquare, Send } from 'lucide-react'

export function ContactForm() {
  return (
    <div className="design-section-spacing  py-12 md:py-20">
      <div className="design-container">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-design-card">
            <CardHeader className="text-center">
              <div className="mx-auto bg-design-primary/10 text-design-primary rounded-design-card h-16 w-16 flex items-center justify-center mb-6">
                <MessageSquare className="h-8 w-8" />
              </div>
              <CardTitle className="text-design-h2 text-design-text-heading">Contact Us</CardTitle>
              <CardDescription className="text-design-text-muted pt-2">
                Have a question or need help? Fill out the form and we'll get back to you soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-design-text-heading">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-design-text-heading">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      className="h-12"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-design-text-heading">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="h-12 pl-12"
                      required
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-design-text-muted" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-design-text-heading">Subject</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="What's this about?"
                    className="h-12"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-design-text-heading">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    className="min-h-[120px] resize-none"
                    required
                  />
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="w-full group">
                    <Send className="mr-2 h-4 w-4 transition-design group-hover:translate-x-1" />
                    Send Message
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="text-sm text-design-text-muted justify-center">
              <p>
                Or email us at <a href="mailto:info@hadiyyati.com" className="font-medium text-design-primary hover:underline">info@hadiyyati.com</a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
} 