'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, MessageSquare, Send } from 'lucide-react'
import { useLanguage } from '@/lib/contexts/LanguageContext'

export function ContactForm() {
  const { t } = useLanguage()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, subject, message, company }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        setStatus('error')
        setError(data.error || t('contact.error'))
        return
      }

      setStatus('success')
      setFirstName('')
      setLastName('')
      setEmail('')
      setSubject('')
      setMessage('')
      setCompany('')
    } catch {
      setStatus('error')
      setError(t('contact.error'))
    }
  }

  return (
    <div className="design-section-spacing  py-12 md:py-20">
      <div className="design-container">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-design-card">
            <CardHeader className="text-center">
              <div className="mx-auto bg-design-primary/10 text-design-primary rounded-design-card h-16 w-16 flex items-center justify-center mb-6">
                <MessageSquare className="h-8 w-8" />
              </div>
              <CardTitle className="text-design-h2 text-design-text-heading">{t('contact.title')}</CardTitle>
              <CardDescription className="text-design-text-muted pt-2">
                {t('contact.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="hidden" aria-hidden="true">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-design-text-heading">{t('contact.firstName')}</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder={t('contact.firstNamePh')}
                      className="h-12"
                      required
                      maxLength={80}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-design-text-heading">{t('contact.lastName')}</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder={t('contact.lastNamePh')}
                      className="h-12"
                      required
                      maxLength={80}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-design-text-heading">{t('contact.email')}</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t('contact.emailPh')}
                      className="h-12 ps-12"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-design-text-muted" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-design-text-heading">{t('contact.subject')}</Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder={t('contact.subjectPh')}
                    className="h-12"
                    required
                    maxLength={200}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-design-text-heading">{t('contact.message')}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder={t('contact.messagePh')}
                    className="min-h-[120px] resize-none"
                    required
                    maxLength={5000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {status === 'success' && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                    {t('contact.success')}
                  </p>
                )}
                {status === 'error' && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                    {error || t('contact.error')}
                  </p>
                )}

                <div className="pt-4">
                  <Button type="submit" className="w-full group" disabled={status === 'sending'}>
                    <Send className="me-2 h-4 w-4 transition-design group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    {status === 'sending' ? t('contact.sending') : t('contact.send')}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="text-sm text-design-text-muted justify-center">
              <p>
                {t('contact.orEmail')} <a href="mailto:info@hadiyyati.me" className="font-medium text-design-primary hover:underline">info@hadiyyati.me</a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
