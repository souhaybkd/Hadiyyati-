import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { giftNotificationCopy } from '@/lib/email-gift-notification-copy'
import { getEmailLogoUrl, getEmailSiteUrl } from '@/lib/email-brand'

interface GiftNotificationEmailProps {
  recipientName: string
  senderName: string
  giftItems: Array<{
    title: string
    price: number
    image_url?: string
    description?: string
  }>
  giftMessage?: string
  totalAmount: number
  viewGiftUrl: string
  logoUrl?: string
  siteUrl?: string
}

export default function GiftNotificationEmail({
  recipientName = 'John',
  senderName = 'Sarah',
  giftItems = [
    {
      title: 'Sample Gift Item',
      price: 29.99,
      description: 'A wonderful gift item',
    },
  ],
  giftMessage,
  totalAmount = 29.99,
  viewGiftUrl = 'https://hadiyyati.com/dashboard?tab=history',
  logoUrl = getEmailLogoUrl(),
  siteUrl = getEmailSiteUrl(),
}: GiftNotificationEmailProps) {
  const copy = giftNotificationCopy
  const amountFormatted = `$${totalAmount.toFixed(2)}`
  const previewText = copy.preview(senderName)

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Link href={siteUrl}>
              <Img
                src={logoUrl}
                width="160"
                height="48"
                alt="hadiyyati | هديتي"
                style={logo}
              />
            </Link>
            <Heading style={h1}>{copy.headingEn}</Heading>
            <Heading style={h1Ar}>{copy.headingAr}</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>{copy.greetingEn(recipientName)}</Text>
            <Text style={paragraphRtl}>{copy.greetingAr(recipientName)}</Text>

            <Text style={paragraph}>{copy.bodyEn(senderName)}</Text>
            <Text style={paragraphRtl}>{copy.bodyAr(senderName)}</Text>

            {giftMessage && (
              <Section style={messageSection}>
                <Text style={messageLabel}>{copy.messageLabelEn(senderName)}</Text>
                <Text style={messageLabelRtl}>{copy.messageLabelAr(senderName)}</Text>
                <Text style={messageText} dir="auto">&ldquo;{giftMessage}&rdquo;</Text>
              </Section>
            )}

            <Section style={itemsSection}>
              <Heading style={h2}>{copy.itemsHeadingEn}</Heading>
              <Heading style={h2Ar}>{copy.itemsHeadingAr}</Heading>
              {giftItems.map((item, index) => (
                <Section key={index} style={itemCard}>
                  <div style={itemContent}>
                    {item.image_url && (
                      <Img
                        src={item.image_url}
                        width="80"
                        height="80"
                        alt={item.title}
                        style={itemImage}
                      />
                    )}
                    <div style={itemDetails}>
                      <Text style={itemTitle}>{item.title}</Text>
                      {item.description && (
                        <Text style={itemDescription}>{item.description}</Text>
                      )}
                      <Text style={itemPrice}>${item.price.toFixed(2)}</Text>
                    </div>
                  </div>
                </Section>
              ))}

              <Hr style={hr} />
              <Text style={totalText}>
                <strong>{copy.totalEn(amountFormatted)}</strong>
              </Text>
              <Text style={totalTextRtl}>
                <strong>{copy.totalAr(amountFormatted)}</strong>
              </Text>
            </Section>

            <Section style={buttonSection}>
              <Button style={button} href={viewGiftUrl}>
                {copy.ctaEn} · {copy.ctaAr}
              </Button>
            </Section>

            <Text style={paragraph}>{copy.afterCtaEn(senderName)}</Text>
            <Text style={paragraphRtl}>{copy.afterCtaAr(senderName)}</Text>

            <Text style={smallText}>{copy.signoffEn}</Text>
            <Text style={smallTextRtl}>{copy.signoffAr}</Text>
          </Section>

          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              {copy.footerEn}{' '}
              <Link href="mailto:support@hadiyyati.com" style={link}>
                support@hadiyyati.com
              </Link>
            </Text>
            <Text style={footerTextRtl}>
              {copy.footerAr}{' '}
              <Link href="mailto:support@hadiyyati.com" style={link}>
                support@hadiyyati.com
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href={siteUrl} style={link}>
                {copy.visitEn}
              </Link>{' '}
              |{' '}
              <Link href={siteUrl} style={link}>
                {copy.visitAr}
              </Link>{' '}
              |{' '}
              <Link href={`${siteUrl}/unsubscribe`} style={link}>
                {copy.unsubscribeEn}
              </Link>{' '}
              |{' '}
              <Link href={`${siteUrl}/unsubscribe`} style={link}>
                {copy.unsubscribeAr}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Tahoma,Arial,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  textAlign: 'center' as const,
  padding: '24px 20px 12px',
}

const logo = {
  margin: '0 auto 16px',
  display: 'block',
  objectFit: 'contain' as const,
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '8px 0 4px',
  padding: '0',
  textAlign: 'center' as const,
}

const h1Ar = {
  ...h1,
  fontSize: '22px',
  direction: 'rtl' as const,
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '16px 0 8px',
}

const h2Ar = {
  ...h2,
  direction: 'rtl' as const,
  textAlign: 'right' as const,
  margin: '0 0 12px',
}

const content = {
  padding: '0 40px',
}

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '12px 0',
}

const paragraphRtl = {
  ...paragraph,
  direction: 'rtl' as const,
  textAlign: 'right' as const,
}

const messageSection = {
  backgroundColor: '#f8f9fa',
  borderLeft: '4px solid #7c3aed',
  borderRight: '4px solid #7c3aed',
  padding: '16px 20px',
  margin: '24px 0',
  borderRadius: '4px',
}

const messageLabel = {
  color: '#7c3aed',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 4px',
}

const messageLabelRtl = {
  ...messageLabel,
  direction: 'rtl' as const,
  textAlign: 'right' as const,
  margin: '0 0 8px',
}

const messageText = {
  color: '#374151',
  fontSize: '16px',
  fontStyle: 'italic',
  lineHeight: '24px',
  margin: '0',
}

const itemsSection = {
  margin: '32px 0',
}

const itemCard = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '12px 0',
}

const itemContent = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
}

const itemImage = {
  borderRadius: '6px',
  objectFit: 'cover' as const,
}

const itemDetails = {
  flex: 1,
}

const itemTitle = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px',
}

const itemDescription = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 8px',
  lineHeight: '20px',
}

const itemPrice = {
  color: '#059669',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const totalText = {
  color: '#111827',
  fontSize: '16px',
  margin: '8px 0 0',
  textAlign: 'right' as const,
}

const totalTextRtl = {
  ...totalText,
  direction: 'rtl' as const,
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: '100%',
  maxWidth: '320px',
  padding: '14px 20px',
  lineHeight: '22px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const footer = {
  padding: '0 40px',
}

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '8px 0',
  textAlign: 'center' as const,
}

const footerTextRtl = {
  ...footerText,
  direction: 'rtl' as const,
}

const link = {
  color: '#7c3aed',
  textDecoration: 'underline',
}

const smallText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '12px 0 4px',
  textAlign: 'center' as const,
}

const smallTextRtl = {
  ...smallText,
  direction: 'rtl' as const,
}
