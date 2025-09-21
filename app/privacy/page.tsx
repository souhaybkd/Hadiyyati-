import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - Hadiaytti',
  description: 'Privacy Policy for Hadiaytti gift-giving platform',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Privacy Policy</h1>
          <p className="text-lg text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Introduction</h2>
            <p className="mb-4 text-gray-700">
              At Hadiaytti ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
            <p className="mb-4 text-gray-700">
              By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">2.1 Personal Information</h3>
            <p className="mb-4 text-gray-700">We collect the following personal information when you:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Create an account:</strong> Name, email address, username</li>
              <li><strong>Make a purchase:</strong> Billing information, shipping address (processed by Stripe)</li>
              <li><strong>Create wishlists:</strong> Product preferences, descriptions, images</li>
              <li><strong>Contact us:</strong> Name, email, message content</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">2.2 Automatically Collected Information</h3>
            <p className="mb-4 text-gray-700">When you use our Service, we automatically collect:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Usage Data:</strong> Pages visited, time spent, clicks, and interactions</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
              <li><strong>Cookies and Tracking:</strong> Session data, preferences, authentication tokens</li>
              <li><strong>Log Data:</strong> Server logs, error reports, performance metrics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">2.3 Third-Party Information</h3>
            <p className="mb-4 text-gray-700">
              When you use third-party authentication (Google OAuth), we receive basic profile information including your name, email, and profile picture as permitted by your privacy settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. How We Use Your Information</h2>
            <p className="mb-4 text-gray-700">We use your information to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Provide Services:</strong> Create and manage your account, process transactions</li>
              <li><strong>Personalization:</strong> Customize your experience and recommendations</li>
              <li><strong>Communication:</strong> Send notifications, updates, and support responses</li>
              <li><strong>Security:</strong> Protect against fraud, abuse, and security threats</li>
              <li><strong>Analytics:</strong> Understand usage patterns and improve our services</li>
              <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
              <li><strong>Marketing:</strong> Send promotional content (with your consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.1 We Share Information With:</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Service Providers:</strong> Stripe (payments), email services, hosting providers</li>
              <li><strong>Other Users:</strong> Wishlist information you choose to make public</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.2 We Do Not:</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Sell your personal information to third parties</li>
              <li>Share your payment information (handled securely by Stripe)</li>
              <li>Disclose private messages or personal communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Data Security</h2>
            <p className="mb-4 text-gray-700">
              We implement appropriate security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Encryption:</strong> Data in transit and at rest is encrypted</li>
              <li><strong>Access Controls:</strong> Limited access to authorized personnel only</li>
              <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
              <li><strong>Secure Infrastructure:</strong> Industry-standard hosting and database security</li>
              <li><strong>Payment Security:</strong> PCI-compliant payment processing through Stripe</li>
            </ul>
            <p className="mb-4 text-gray-700">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Cookies and Tracking Technologies</h2>
            <p className="mb-4 text-gray-700">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze website usage and performance</li>
              <li>Provide personalized content and recommendations</li>
            </ul>
            <p className="mb-4 text-gray-700">
              You can control cookie settings through your browser, but disabling cookies may affect functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Your Rights and Choices</h2>
            <p className="mb-4 text-gray-700">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Access:</strong> Request copies of your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Restriction:</strong> Limit how we process your information</li>
            </ul>
            <p className="mb-4 text-gray-700">
              To exercise these rights, please contact us at privacy@hadiaytti.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Data Retention</h2>
            <p className="mb-4 text-gray-700">
              We retain your information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Improve our services and user experience</li>
            </ul>
            <p className="mb-4 text-gray-700">
              When you delete your account, we will delete or anonymize your personal information within 30 days, except where retention is required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. International Data Transfers</h2>
            <p className="mb-4 text-gray-700">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Children's Privacy</h2>
            <p className="mb-4 text-gray-700">
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Third-Party Links</h2>
            <p className="mb-4 text-gray-700">
              Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Changes to This Privacy Policy</h2>
            <p className="mb-4 text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Posting the updated policy on our website</li>
              <li>Sending an email notification to your registered email address</li>
              <li>Providing notice through our Service</li>
            </ul>
            <p className="mb-4 text-gray-700">
              Your continued use of the Service after any changes indicates your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">13. Contact Us</h2>
            <p className="mb-4 text-gray-700">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-none mb-4 text-gray-700">
              <li><strong>Email:</strong> privacy@hadiaytti.com</li>
              <li><strong>Legal Email:</strong> legal@hadiaytti.com</li>
              <li><strong>Address:</strong> [Your Company Address]</li>
            </ul>
            <p className="mb-4 text-gray-700">
              We will respond to your inquiries within 30 days.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-sm text-gray-500">
                This Privacy Policy is effective as of {new Date().toLocaleDateString()} and was last updated on {new Date().toLocaleDateString()}.
              </p>
              <Link 
                href="/terms" 
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                View Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
