import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - Hadiaytti',
  description: 'Terms of Service for Hadiaytti gift-giving platform',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Terms of Service</h1>
          <p className="text-lg text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Acceptance of Terms</h2>
            <p className="mb-4 text-gray-700">
              Welcome to Hadiaytti ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our website and services located at hadiaytti.com (the "Service") operated by Hadiaytti.
            </p>
            <p className="mb-4 text-gray-700">
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Service Description</h2>
            <p className="mb-4 text-gray-700">
              Hadiaytti is a gift-giving platform that enables users to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Create and manage personalized wishlists</li>
              <li>Share wishlists with friends and family</li>
              <li>Purchase gifts from other users' wishlists</li>
              <li>Process secure payments through third-party providers</li>
              <li>Send and receive gift notifications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. User Accounts</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.1 Account Creation</h3>
            <p className="mb-4 text-gray-700">
              To use certain features of our Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">3.2 Account Security</h3>
            <p className="mb-4 text-gray-700">
              You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. User Conduct</h2>
            <p className="mb-4 text-gray-700">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Upload, post, or transmit any content that is harmful, threatening, abusive, or offensive</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Use the Service to spam, harass, or send unsolicited communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Payments and Fees</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.1 Payment Processing</h3>
            <p className="mb-4 text-gray-700">
              All payments are processed securely through Stripe, a third-party payment processor. We do not store your payment information on our servers.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.2 Platform Fees</h3>
            <p className="mb-4 text-gray-700">
              We may charge platform fees for certain transactions. These fees will be clearly disclosed before you complete any transaction. Current platform fee rates are available in your account dashboard.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.3 Refunds</h3>
            <p className="mb-4 text-gray-700">
              Refunds are handled on a case-by-case basis. Please contact our support team for refund requests. We reserve the right to determine refund eligibility at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Intellectual Property</h2>
            <p className="mb-4 text-gray-700">
              The Service and its original content, features, and functionality are and will remain the exclusive property of Hadiaytti and its licensors. The Service is protected by copyright, trademark, and other laws.
            </p>
            <p className="mb-4 text-gray-700">
              You retain ownership of any content you upload to the Service, but you grant us a non-exclusive, worldwide, royalty-free license to use, modify, and display such content in connection with the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Privacy</h2>
            <p className="mb-4 text-gray-700">
              Your privacy is important to us. Please review our <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</Link>, which also governs your use of the Service, to understand our practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Disclaimers and Limitation of Liability</h2>
            <p className="mb-4 text-gray-700">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE MAKE NO WARRANTIES, EXPRESSED OR IMPLIED, INCLUDING WITHOUT LIMITATION THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mb-4 text-gray-700">
              IN NO EVENT SHALL HADIAYTTI BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Termination</h2>
            <p className="mb-4 text-gray-700">
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="mb-4 text-gray-700">
              You may terminate your account at any time by contacting our support team or through your account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Changes to Terms</h2>
            <p className="mb-4 text-gray-700">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Contact Information</h2>
            <p className="mb-4 text-gray-700">
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul className="list-none mb-4 text-gray-700">
              <li>Email: legal@hadiaytti.com</li>
              <li>Address: [Your Company Address]</li>
            </ul>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              These Terms of Service are effective as of {new Date().toLocaleDateString()} and were last updated on {new Date().toLocaleDateString()}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 