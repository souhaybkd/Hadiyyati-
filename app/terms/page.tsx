import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms and Conditions - Hadiyyati',
  description: 'Terms and Conditions for Hadiyyati gift-giving platform',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">TERMS AND CONDITIONS</h1>
          <p className="text-lg text-gray-600">Last Updated: November 4, 2025</p>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. INTRODUCTION</h2>
            <p className="mb-4 text-gray-700">
              Welcome to Hadiyyati (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, &quot;the Platform&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the Hadiyyati website, mobile application, and related services (collectively, the &quot;Services&quot;).
            </p>
            <p className="mb-4 text-gray-700">
              By accessing or using our Services, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use our Services.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">1.1 Territorial Scope</h3>
            <p className="mb-4 text-gray-700">
              Hadiyyati Ltd is a company registered in the United Kingdom and operates internationally. While our Services are accessible in the Middle East and North Africa (MENA) region and available in Arabic, our operations are governed exclusively by the laws of England and Wales.
            </p>
            <p className="mb-4 text-gray-700">
              By using our Services, you acknowledge that Hadiyyati Ltd is not established, resident, or licensed in any MENA jurisdiction, and you agree that all legal matters will be resolved under UK law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. DEFINITIONS</h2>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>&quot;Receiver&quot;: A user who creates and maintains a wishlist on the Platform</li>
              <li>&quot;Gifter&quot;: A user who purchases gifts for Receivers through the Platform</li>
              <li>&quot;Gift&quot;: An item listed on a Receiver&apos;s wishlist that can be purchased by Gifters</li>
              <li>&quot;Payout&quot;: Funds transferred to Receivers after successful gift purchases</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">2 A. REGULATORY STATUS</h2>
            <p className="mb-4 text-gray-700">
              Hadiyyati Ltd is registered in the United Kingdom under Company Number 16762322, with its registered office at 5, Brayford Square, London, E1 0SG, UNITED KINGDOM.
            </p>
            <p className="mb-4 text-gray-700">
              Hadiyyati Limited is in the process of registering with HMRC under the Money Laundering Regulations 2017.
            </p>
            <p className="mb-4 text-gray-700">
              Hadiyyati is not a bank, e-money issuer, or financial institution. Funds held by Hadiyyati are not protected by the Financial Services Compensation Scheme (FSCS).
            </p>
            <p className="mb-4 text-gray-700">
              The Platform facilitates digital gifting transactions and retains the right to delay, reverse, or cancel any payment to comply with applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. ELIGIBILITY</h2>
            <p className="mb-4 text-gray-700">To use our Services, you must:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Services under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. ACCOUNT REGISTRATION</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.1 Account Creation</h3>
            <p className="mb-4 text-gray-700">
              You may create an account by providing required information directly to us through our registration process.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.2 Account Responsibility</h3>
            <p className="mb-4 text-gray-700">You are responsible for:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breaches</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">4.3 Account Accuracy</h3>
            <p className="mb-4 text-gray-700">
              You must provide truthful, accurate, and complete information. You agree to update this information promptly when it changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. RECEIVER TERMS</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.1 Wishlist Creation</h3>
            <p className="mb-4 text-gray-700">
              Receivers may add lawful items to their wishlists, subject to our Prohibited Items policy.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.2 Verification Requirements</h3>
            <p className="mb-4 text-gray-700">
              To receive payouts, Receivers must complete our verification process, which includes:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Submitting valid government-issued photo identification</li>
              <li>Completing identity verification through our third-party provider</li>
            </ul>
            <p className="mb-4 text-gray-700">
              The verification process ensures compliance with Anti-Money Laundering (AML) and Know Your Customer (KYC) regulations. We reserve the right to request additional documentation at any time.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.3 Payouts</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Hadiyyati retains a 15% platform fee from each gift purchase</li>
              <li>The remaining 85% is transferred to the Receiver&apos;s verified payment account</li>
              <li>Additional transfer, network, or processing fees may apply depending on the selected payment method.</li>
              <li>Payouts are processed according to our standard payout schedule after the holding period</li>
              <li>Receivers are responsible for any taxes applicable to their earnings</li>
              <li>Minimum payout thresholds may apply</li>
              <li>We may withhold or delay payouts if we suspect fraudulent activity or non-compliance</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.4 Receiver Obligations</h3>
            <p className="mb-4 text-gray-700">Receivers must not:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Use the Platform to sell goods or services</li>
              <li>Offer goods or services in exchange for gifts</li>
              <li>Engage in fraudulent or deceptive practices</li>
              <li>Misrepresent themselves or their wishlists</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.5 Holding Period and Refunds</h3>
            <p className="mb-4 text-gray-700">
              When a gift is purchased, the corresponding funds are held for seven (7) business days to allow for fraud and refund checks.
            </p>
            <p className="mb-4 text-gray-700">
              After this holding period, payouts are processed within three (3) to five (5) business days.
            </p>
            <p className="mb-4 text-gray-700">
              Refunds are generally not permitted, except in cases of:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Unauthorized or duplicate transactions, or</li>
              <li>Fraudulent activity confirmed by Hadiyyati</li>
            </ul>
            <p className="mb-4 text-gray-700">
              During the holding period, funds remain in Hadiyyati&apos;s business accounts and cannot be withdrawn.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">5.6 Transaction Limits</h3>
            <p className="mb-4 text-gray-700">
              To ensure compliance with anti-money laundering regulations, the following limits apply:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Maximum per gift: $1,000 (or local currency equivalent)</li>
              <li>Maximum monthly total per Receiver: $5,000</li>
            </ul>
            <p className="mb-4 text-gray-700">
              Higher limits may be approved upon completion of enhanced verification and source-of-funds checks.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. GIFTER TERMS</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">6.1 Gift Purchases</h3>
            <p className="mb-4 text-gray-700">When purchasing a gift:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>You authorize Hadiyyati to charge your selected payment method</li>
              <li>Purchases are final and non-refundable except as specified in Section 5.5</li>
              <li>You agree to pay all applicable fees and charges</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">6.2 No Guarantees</h3>
            <p className="mb-4 text-gray-700">Hadiyyati does not guarantee:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>That Receivers will use gifts as intended</li>
              <li>The quality, safety, or legality of items listed on wishlists</li>
              <li>That Receivers will acknowledge or thank Gifters</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">6.3 Refunds and Cancellations</h3>
            <p className="mb-4 text-gray-700">
              Once a gift purchase is completed, processing begins immediately.
            </p>
            <p className="mb-4 text-gray-700">
              Buyers have 7 days from the date of purchase to request a refund only if the funds have not yet been released to the Receiver. After that period, all sales are final.
            </p>
            <p className="mb-4 text-gray-700">
              Refunds are available solely in cases of fraud, unauthorized transactions, or verified system error.
            </p>
            <p className="mb-4 text-gray-700">
              Hadiyyati reserves the right to hold or delay payouts for up to 7 days to verify compliance with anti-fraud and money-laundering obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. PROHIBITED ITEMS AND ACTIVITIES</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">7.1 Prohibited Items</h3>
            <p className="mb-4 text-gray-700">The following may not be listed on wishlists:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Illegal items or services</li>
              <li>Items involving nudity or implied nudity</li>
              <li>Alcohol and tobacco products</li>
              <li>Items containing THC or illegal substances</li>
              <li>Weapons, explosives, or hazardous materials</li>
              <li>Services or goods offered in exchange for gifts</li>
              <li>Counterfeit or stolen goods</li>
              <li>Items that violate intellectual property rights</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">7.2 Prohibited Activities</h3>
            <p className="mb-4 text-gray-700">Users must not:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Engage in fraudulent, deceptive, or misleading conduct</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to circumvent platform fees</li>
              <li>Use automated systems or bots without authorization</li>
              <li>Interfere with or disrupt the Services</li>
              <li>Impersonate others or misrepresent affiliations</li>
              <li>Provide false information during verification processes</li>
              <li>Engage in money laundering or other financial crimes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. PLATFORM FEES</h2>
            <p className="mb-4 text-gray-700">
              Hadiyyati charges a 15% platform fee on all gift purchases. This fee covers:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Platform maintenance and development</li>
              <li>Payment processing</li>
              <li>Customer support</li>
              <li>Compliance and security measures</li>
              <li>KYC/AML verification costs</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. PAYMENT PROCESSING</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">9.1 Payment Methods</h3>
            <p className="mb-4 text-gray-700">
              We accept various payment methods as displayed on the Platform. You authorize us to charge your selected payment method for all purchases.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">9.2 Third-Party Processors</h3>
            <p className="mb-4 text-gray-700">
              Payments are processed through third-party payment processors. Your use of these services is subject to their terms and conditions.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">9.3 Payment Disputes</h3>
            <p className="mb-4 text-gray-700">
              Any payment disputes must be raised within 30 days of the transaction date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. INTELLECTUAL PROPERTY</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">10.1 Platform Content</h3>
            <p className="mb-4 text-gray-700">
              All content on the Platform, including logos, text, graphics, and software, is owned by Hadiyyati or our licensors and is protected by intellectual property laws.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">10.2 User Content</h3>
            <p className="mb-4 text-gray-700">
              You retain ownership of content you submit to the Platform but grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with operating the Services.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">10.3 Prohibited Use</h3>
            <p className="mb-4 text-gray-700">
              You may not copy, modify, distribute, or create derivative works from our content without express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. PRIVACY AND DATA PROTECTION</h2>
            <p className="mb-4 text-gray-700">
              Your use of our Services is subject to our Privacy Policy, which explains how we collect, use, and protect your personal information. By using our Services, you consent to our data practices as described in the Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. TERMINATION</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">12.1 Termination by You</h3>
            <p className="mb-4 text-gray-700">
              You may terminate your account at any time by contacting us or using the account deletion feature.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">12.2 Termination by Us</h3>
            <p className="mb-4 text-gray-700">We reserve the right to suspend or terminate your account if:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>You breach these Terms</li>
              <li>We suspect fraudulent or illegal activity</li>
              <li>You fail to complete or pass verification requirements</li>
              <li>Required by law or regulatory authorities</li>
              <li>We discontinue the Services</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">12.3 Effect of Termination</h3>
            <p className="mb-4 text-gray-700">Upon termination:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Your right to use the Services ceases immediately</li>
              <li>Outstanding payouts may be withheld pending investigation of any violations</li>
              <li>We may retain certain information as required by law or legitimate business purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">13. DISCLAIMERS</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">13.1 Service Provided &quot;As Is&quot;</h3>
            <p className="mb-4 text-gray-700">
              The Services are provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, either express or implied.
            </p>
            <p className="mb-4 text-gray-700">
              Hadiyyati does not act as a financial advisor, escrow agent, or fiduciary. All payments are made voluntarily by users, and Hadiyyati&apos;s role is limited to payment processing and identity verification.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">13.2 No Warranties</h3>
            <p className="mb-4 text-gray-700">We do not warrant that:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>The Services will be uninterrupted, secure, or error-free</li>
              <li>Defects will be corrected</li>
              <li>The Services are free from viruses or harmful components</li>
              <li>Results from using the Services will be accurate or reliable</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">13.3 User Interactions</h3>
            <p className="mb-4 text-gray-700">
              We are not responsible for disputes between users or the actions of other users.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">13.4 Consumer Rights</h3>
            <p className="mb-4 text-gray-700">
              We aim to operate in line with international consumer protection standards. Users in the MENA region are encouraged to contact us with any complaints or refund requests, which will be handled fairly and in good faith. However, all formal disputes and legal interpretations remain governed by the laws of England and Wales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">14. LIMITATION OF LIABILITY</h2>
            <p className="mb-4 text-gray-700">To the maximum extent permitted by law:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Hadiyyati shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Our total liability shall not exceed the amount of fees paid by you in the 12 months preceding the claim</li>
              <li>We are not liable for losses caused by circumstances beyond our reasonable control</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">15. INDEMNIFICATION</h2>
            <p className="mb-4 text-gray-700">
              You agree to indemnify and hold Hadiyyati, its officers, directors, employees, and agents harmless from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Your use of the Services</li>
              <li>Your breach of these Terms</li>
              <li>Your violation of any rights of third parties</li>
              <li>Your content or conduct on the Platform</li>
              <li>Any false information provided during verification</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">16. DISPUTE RESOLUTION</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.1 Governing Law</h3>
            <p className="mb-4 text-gray-700">
              These Terms are governed by the laws of England and Wales, without regard to conflict of law principles.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.2 Jurisdiction</h3>
            <p className="mb-4 text-gray-700">
              You agree to submit to the exclusive jurisdiction of the courts of England and Wales for resolution of any disputes.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.3 Informal Resolution</h3>
            <p className="mb-4 text-gray-700">
              Before filing any legal action, you agree to attempt to resolve disputes informally by contacting us.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">16.4 Local Regulations</h3>
            <p className="mb-4 text-gray-700">
              Users located outside the United Kingdom acknowledge that while these Terms are governed by the laws of England and Wales, they may also be subject to local consumer protection, e-commerce, and anti-money laundering regulations applicable in their country of residence. Nothing in these Terms shall exclude or limit any mandatory legal rights granted under such local laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">17. MODIFICATIONS TO TERMS</h2>
            <p className="mb-4 text-gray-700">
              We reserve the right to modify these Terms at any time. We will notify users of material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Posting the updated Terms on the Platform</li>
              <li>Sending email notifications to registered users</li>
              <li>Displaying a prominent notice on the Platform</li>
            </ul>
            <p className="mb-4 text-gray-700">
              Your continued use of the Services after changes become effective constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">18. GENERAL PROVISIONS</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">18.1 Entire Agreement</h3>
            <p className="mb-4 text-gray-700">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Hadiyyati.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">18.2 Severability</h3>
            <p className="mb-4 text-gray-700">
              If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full effect.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">18.3 No Waiver</h3>
            <p className="mb-4 text-gray-700">
              Our failure to enforce any right or provision shall not constitute a waiver of such right or provision.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">18.4 Assignment</h3>
            <p className="mb-4 text-gray-700">
              You may not assign or transfer these Terms. We may assign our rights and obligations without restriction.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">18.5 Language</h3>
            <p className="mb-4 text-gray-700">
              These Terms are available in both English and Arabic for convenience. In case of any inconsistency or difference in interpretation, the English version shall prevail and govern.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">19. COMPLIANCE</h2>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">19.1 Anti-Money Laundering</h3>
            <p className="mb-4 text-gray-700">
              We comply with Anti-Money Laundering (AML) regulations. Users must cooperate with verification processes and provide requested documentation.
            </p>
            <p className="mb-4 text-gray-700">
              Hadiyyati reserves the right to delay or block transactions, suspend accounts, or report suspicious activity to the National Crime Agency (NCA) as required by UK law.
            </p>
            <p className="mb-4 text-gray-700">
              Users acknowledge that such reports are confidential and that Hadiyyati is prohibited by law from disclosing if or when such reports are made.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">19.2 Know Your Customer</h3>
            <p className="mb-4 text-gray-700">
              We implement Know Your Customer (KYC) procedures through third-party verification providers to prevent fraud, comply with financial regulations, and verify user identities. All Receivers seeking to receive payouts must successfully complete identity verification.
            </p>
            <p className="mb-4 text-gray-700">
              Hadiyyati reserves the right to delay or block transactions, suspend accounts, or report suspicious activity to regulatory authorities as required by UK law.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">19.3 Sanctions Compliance</h3>
            <p className="mb-4 text-gray-700">
              Users must not be located in or associated with countries or individuals subject to international sanctions.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-800">19.4 Verification Refusal</h3>
            <p className="mb-4 text-gray-700">
              We reserve the right to refuse service to any user who fails to complete verification or whose verification raises compliance concerns.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">20. TAX AND REPORTING</h2>
            <p className="mb-4 text-gray-700">
              Receivers are responsible for reporting and paying any taxes applicable to their earnings under their local laws. Hadiyyati does not provide tax advice or file tax returns on behalf of users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">21. CONTACT INFORMATION</h2>
            <p className="mb-4 text-gray-700">For questions about these Terms, please contact us at:</p>
            <ul className="list-none mb-4 text-gray-700 space-y-2">
              <li><strong>Hadiyyati Ltd</strong></li>
              <li>Email: info@hadiyyati.com</li>
              <li>Website: www.hadiyyati.me</li>
              <li>Registered Office: 5, Brayford Square, London, E1 0SG, UNITED KINGDOM</li>
            </ul>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              By using Hadiyyati, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 