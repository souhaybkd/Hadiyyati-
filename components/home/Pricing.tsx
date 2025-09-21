'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Crown, Zap } from 'lucide-react'

export function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: 0,
      description: 'Perfect for getting started',
      icon: Zap,
      features: [
        'Up to 10 wishlist items',
        'Basic customization',
        'Share with friends & family',
        'Mobile responsive design',
        'Email notifications',
      ],
      limitations: [
        'Hadiyati branding',
        'Basic analytics',
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Pro',
      price: 9.99,
      description: 'For power users and creators',
      icon: Star,
      features: [
        'Unlimited wishlist items',
        'Advanced customization',
        'Custom domain support',
        'Priority customer support',
        'Advanced analytics',
        'Remove Hadiyati branding',
        'Export wishlist data',
        'Team collaboration',
      ],
      limitations: [],
      cta: 'Start Pro Trial',
      popular: true,
    },
    {
      name: 'Premium',
      price: 19.99,
      description: 'For businesses and organizations',
      icon: Crown,
      features: [
        'Everything in Pro',
        'Multiple wishlists',
        'Team management',
        'Custom integrations',
        'API access',
        'Dedicated account manager',
        'White-label solution',
        'Advanced security features',
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false,
    },
  ]

  return (
    <div>
      
    </div>
    // <div className="design-section-spacing bg-design-light">
    //   <div className="design-container">
    //     <div className="text-center mb-16">
    //       <h2 className="text-design-h2 font-bold mb-6 text-design-text-heading">
    //         Simple, Transparent Pricing
    //       </h2>
    //       <p className="text-design-body text-design-text-muted max-w-2xl mx-auto">
    //         Choose the perfect plan for your needs. Start free and upgrade anytime. 
    //         All plans include our core features with no hidden fees.
    //       </p>
    //     </div>

    //     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
    //       {plans.map((plan) => (
    //         <Card 
    //           key={plan.name} 
    //           className={`relative shadow-design-card hover:shadow-design-card-hover transition-design ${
    //             plan.popular ? 'ring-2 ring-design-primary scale-105' : ''
    //           }`}
    //         >
    //           {plan.popular && (
    //             <Badge 
    //               variant="primary" 
    //               className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1"
    //             >
    //               Most Popular
    //             </Badge>
    //           )}
              
    //           <CardHeader className="text-center pb-6">
    //             <div className="w-16 h-16 bg-design-primary/10 rounded-design-card flex items-center justify-center mx-auto mb-4">
    //               <plan.icon className="h-8 w-8 text-design-primary" />
    //             </div>
    //             <CardTitle className="text-design-h3 text-design-text-heading mb-2">
    //               {plan.name}
    //             </CardTitle>
    //             <div className="mb-2">
    //               <span className="text-4xl font-bold text-design-text-heading">
    //                 ${plan.price}
    //               </span>
    //               {plan.price > 0 && (
    //                 <span className="text-design-text-muted">/month</span>
    //               )}
    //             </div>
    //             <p className="text-design-text-muted text-design-small">
    //               {plan.description}
    //             </p>
    //           </CardHeader>
              
    //           <CardContent className="pt-0">
    //             <Button 
    //               className={`w-full mb-8 ${plan.popular ? 'shadow-design-card' : ''}`}
    //               variant={plan.popular ? 'default' : 'outline'}
    //               size="lg"
    //             >
    //               {plan.cta}
    //             </Button>
                
    //             <div className="space-y-4">
    //               <div>
    //                 <h4 className="font-semibold text-design-text-heading mb-3">
    //                   What's included:
    //                 </h4>
    //                 <ul className="space-y-2">
    //                   {plan.features.map((feature, index) => (
    //                     <li key={index} className="flex items-start">
    //                       <Check className="h-4 w-4 text-design-secondary mr-3 mt-0.5 flex-shrink-0" />
    //                       <span className="text-design-small text-design-text-muted">
    //                         {feature}
    //                       </span>
    //                     </li>
    //                   ))}
    //                 </ul>
    //               </div>
                  
    //               {plan.limitations.length > 0 && (
    //                 <div className="pt-4 border-t border-design-gray-200">
    //                   <h4 className="font-semibold text-design-text-heading mb-3">
    //                     Limitations:
    //                   </h4>
    //                   <ul className="space-y-2">
    //                     {plan.limitations.map((limitation, index) => (
    //                       <li key={index} className="flex items-start">
    //                         <span className="w-4 h-4 border border-design-gray-300 rounded mr-3 mt-0.5 flex-shrink-0"></span>
    //                         <span className="text-design-small text-design-text-muted">
    //                           {limitation}
    //                         </span>
    //                       </li>
    //                     ))}
    //                   </ul>
    //                 </div>
    //               )}
    //             </div>
    //           </CardContent>
    //         </Card>
    //       ))}
    //     </div>

    //     {/* FAQ about pricing */}
    //     <div className="text-center">
    //       <h3 className="text-design-h3 font-semibold mb-6 text-design-text-heading">
    //         Frequently Asked Questions
    //       </h3>
    //       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
    //         <div className="text-left">
    //           <h4 className="font-semibold text-design-text-heading mb-2">
    //             Can I change plans anytime?
    //           </h4>
    //           <p className="text-design-text-muted text-design-small">
    //             Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
    //           </p>
    //         </div>
    //         <div className="text-left">
    //           <h4 className="font-semibold text-design-text-heading mb-2">
    //             Is there a free trial?
    //           </h4>
    //           <p className="text-design-text-muted text-design-small">
    //             Yes! Pro and Premium plans come with a 14-day free trial. No credit card required.
    //           </p>
    //         </div>
    //         <div className="text-left">
    //           <h4 className="font-semibold text-design-text-heading mb-2">
    //             What payment methods do you accept?
    //           </h4>
    //           <p className="text-design-text-muted text-design-small">
    //             We accept all major credit cards, PayPal, and bank transfers for annual plans.
    //           </p>
    //         </div>
    //         <div className="text-left">
    //           <h4 className="font-semibold text-design-text-heading mb-2">
    //             Can I cancel anytime?
    //           </h4>
    //           <p className="text-design-text-muted text-design-small">
    //             Absolutely! Cancel anytime with no questions asked. You'll retain access until your billing period ends.
    //           </p>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  )
} 