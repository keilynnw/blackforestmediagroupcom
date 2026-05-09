import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface ContactNotificationProps {
  name?: string
  email?: string
  brand?: string
  vision?: string
}

const ContactNotificationEmail = ({
  name = '—',
  email = '—',
  brand = '—',
  vision = '—',
}: ContactNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New inquiry from {name}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Inquiry</Heading>
        <Text style={muted}>Submitted via your website contact form.</Text>

        <Section style={section}>
          <Text style={label}>Name</Text>
          <Text style={value}>{name}</Text>

          <Text style={label}>Email</Text>
          <Text style={value}>{email}</Text>

          <Text style={label}>Brand / Business</Text>
          <Text style={value}>{brand}</Text>
        </Section>

        <Hr style={hr} />

        <Text style={label}>Vision</Text>
        <Text style={vision_text}>{vision}</Text>

        <Hr style={hr} />
        <Text style={footer}>Black Forest Signature Marketing</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New inquiry from ${data?.name || 'website visitor'}`,
  displayName: 'Contact form notification',
  to: 'notify@blackforestmediagroup.com',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    brand: 'Acme Co.',
    vision: 'Looking for elevated social media management for our boutique brand.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Cormorant Garamond", serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '28px', fontWeight: 400, color: '#1a1a1a', margin: '0 0 8px', letterSpacing: '0.02em' }
const muted = { fontSize: '13px', color: '#888', margin: '0 0 28px', textTransform: 'uppercase' as const, letterSpacing: '0.2em' }
const section = { margin: '0 0 24px' }
const label = { fontSize: '11px', color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.25em', margin: '16px 0 4px' }
const value = { fontSize: '16px', color: '#1a1a1a', margin: '0 0 8px' }
const vision_text = { fontSize: '15px', color: '#333', lineHeight: 1.7, margin: '0 0 24px', whiteSpace: 'pre-wrap' as const }
const hr = { border: 'none', borderTop: '1px solid #e5e5e5', margin: '24px 0' }
const footer = { fontSize: '11px', color: '#aaa', textAlign: 'center' as const, letterSpacing: '0.2em', textTransform: 'uppercase' as const }
