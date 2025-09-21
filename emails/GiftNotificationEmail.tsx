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
  viewGiftUrl = 'https://hadiaytti.com/dashboard?tab=history',
}: GiftNotificationEmailProps) {
  const previewText = `🎁 You've received a gift from ${senderName}!`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://hadiaytti.com/logo.png"
              width="50"
              height="50"
              alt="Hadiaytti"
              style={logo}
            />
            <Heading style={h1}>🎁 You've Got a Gift!</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={paragraph}>
              Hi <strong>{recipientName}</strong>,
            </Text>
            
            <Text style={paragraph}>
              Great news! <strong>{senderName}</strong> has sent you a wonderful gift through Hadiaytti! 
              Your wishlist items have been purchased and are on their way to you.
            </Text>

            {/* Gift Message */}
            {giftMessage && (
              <Section style={messageSection}>
                <Text style={messageLabel}>💌 Personal Message from {senderName}:</Text>
                <Text style={messageText}>"{giftMessage}"</Text>
              </Section>
            )}

            {/* Gift Items */}
            <Section style={itemsSection}>
              <Heading style={h2}>Your Gift Items:</Heading>
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
              <div style={totalSection}>
                <Text style={totalText}>
                  <strong>Total Gift Value: ${totalAmount.toFixed(2)}</strong>
                </Text>
              </div>
            </Section>

            {/* Call to Action */}
            <Section style={buttonSection}>
              <Button style={button} href={viewGiftUrl}>
                View Your Gift Details
              </Button>
            </Section>

            <Text style={paragraph}>
              You can view all your gift details, send a thank you note to {senderName}, 
              and track your items in your Hadiaytti dashboard.
            </Text>

            <Text style={smallText}>
              Thank you for using Hadiaytti - making gift-giving simple and meaningful! 💝
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              This email was sent by Hadiaytti. If you have any questions, please{' '}
              <Link href="mailto:support@hadiaytti.com" style={link}>
                contact our support team
              </Link>
              .
            </Text>
            <Text style={footerText}>
              <Link href="https://hadiaytti.com" style={link}>
                Visit Hadiaytti
              </Link>{' '}
              |{' '}
              <Link href="https://hadiaytti.com/unsubscribe" style={link}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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
  padding: '20px 0',
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '20px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '20px 0 15px',
}

const content = {
  padding: '0 40px',
}

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '16px 0',
}

const messageSection = {
  backgroundColor: '#f8f9fa',
  borderLeft: '4px solid #7c3aed',
  padding: '16px 20px',
  margin: '24px 0',
  borderRadius: '4px',
}

const messageLabel = {
  color: '#7c3aed',
  fontSize: '14px',
  fontWeight: 'bold',
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

const totalSection = {
  textAlign: 'right' as const,
  padding: '16px 0 0',
}

const totalText = {
  color: '#111827',
  fontSize: '18px',
  margin: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: '100%',
  maxWidth: '300px',
  padding: '14px 20px',
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
  lineHeight: '16px',
  margin: '8px 0',
  textAlign: 'center' as const,
}

const link = {
  color: '#7c3aed',
  textDecoration: 'underline',
}

const smallText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
}
