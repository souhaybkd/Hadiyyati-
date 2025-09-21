'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Shield, 
  Lock, 
  Eye, 
  CreditCard,
  CheckCircle,
  Users,
  Globe,
  Award
} from 'lucide-react'

export function TrustSecurity() {
  const features = [
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Your data is protected with 256-bit SSL encryption and secure cloud infrastructure.',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'We never sell your data. You control who sees your wishlist and personal information.',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'All transactions are processed through secure, PCI-compliant payment gateways.',
    },
    {
      icon: Eye,
      title: 'Full Transparency',
      description: 'Clear privacy policy, no hidden fees, and you own all your data and content.',
    },
  ]

  const stats = [
    {
      icon: Users,
      number: '50,000+',
      label: 'Trusted Users',
    },
    {
      icon: Globe,
      number: '25+',
      label: 'Countries',
    },
    {
      icon: CheckCircle,
      number: '99.9%',
      label: 'Uptime',
    },
    {
      icon: Award,
      number: '5★',
      label: 'User Rating',
    },
  ]

  const certifications = [
    'SOC 2 Type II',
    'GDPR Compliant',
    'PCI DSS Level 1',
    'ISO 27001',
  ]

  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="text-center mb-16">
          <h2 className="text-design-h2 font-bold mb-6 text-design-text-heading">
            Your Trust is Our Priority
          </h2>
          <p className="text-design-body text-design-text-muted max-w-2xl mx-auto">
            We take security and privacy seriously. Your personal information and gifts 
            are protected with enterprise-grade security measures.
          </p>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center shadow-design-light hover:shadow-design-card transition-design">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-design-primary/10 rounded-design-card flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-design-primary" />
                </div>
                <h3 className="text-design-body font-semibold mb-3 text-design-text-heading">
                  {feature.title}
                </h3>
                <p className="text-design-small text-design-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-design-light rounded-design-image p-8 mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className="h-6 w-6 text-design-primary mr-2" />
                  <span className="text-2xl lg:text-3xl font-bold text-design-text-heading">
                    {stat.number}
                  </span>
                </div>
                <p className="text-design-small text-design-text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="text-center">
          <h3 className="text-design-h3 font-semibold mb-8 text-design-text-heading">
            Certified & Compliant
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {certifications.map((cert, index) => (
              <div key={index} className="flex items-center">
                <div className="w-12 h-12 bg-design-primary/10 rounded-design-button flex items-center justify-center mr-3">
                  <CheckCircle className="h-6 w-6 text-design-primary" />
                </div>
                <span className="text-design-body font-medium text-design-text-heading">
                  {cert}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-design-gray-100 rounded-design-card">
            <p className="text-design-text-muted text-design-small">
              <strong>Security Commitment:</strong> We undergo regular security audits, 
              maintain strict data handling procedures, and follow industry best practices 
              to keep your information safe and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 