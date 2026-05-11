import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface PortalActivityProps {
  kind?: 'message' | 'upload'
  projectTitle?: string
  actorName?: string
  detail?: string
  projectUrl?: string
}

const PortalActivityEmail = ({
  kind = 'message',
  projectTitle = '—',
  actorName = '—',
  detail = '',
  projectUrl = '',
}: PortalActivityProps) => {
  const verb = kind === 'upload' ? 'uploaded a file to' : 'sent a message in'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{actorName} {verb} {projectTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Client Portal Activity</Heading>
          <Text style={muted}>{kind === 'upload' ? 'New file uploaded' : 'New message'}</Text>

          <Section style={section}>
            <Text style={label}>Project</Text>
            <Text style={value}>{projectTitle}</Text>

            <Text style={label}>From</Text>
            <Text style={value}>{actorName}</Text>

            {detail ? (
              <>
                <Text style={label}>{kind === 'upload' ? 'File' : 'Message'}</Text>
                <Text style={detailText}>{detail}</Text>
              </>
            ) : null}
          </Section>

          {projectUrl ? (
            <>
              <Hr style={hr} />
              <Text style={value}>
                <a href={projectUrl} style={link}>Open project →</a>
              </Text>
            </>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>Black Forest Signature Marketing</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PortalActivityEmail,
  subject: (data: Record<string, any>) =>
    data?.kind === 'upload'
      ? `New file uploaded — ${data?.projectTitle ?? 'Client portal'}`
      : `New message — ${data?.projectTitle ?? 'Client portal'}`,
  displayName: 'Client portal activity',
  to: 'notify@blackforestmediagroup.com',
  previewData: {
    kind: 'message',
    projectTitle: 'Acme Brand Refresh',
    actorName: 'Jane Doe',
    detail: 'Hi — could you take a look at the latest draft?',
    projectUrl: 'https://blackforestmediagroup.com/portal',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Cormorant Garamond", serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '28px', fontWeight: 400, color: '#1a1a1a', margin: '0 0 8px', letterSpacing: '0.02em' }
const muted = { fontSize: '13px', color: '#888', margin: '0 0 28px', textTransform: 'uppercase' as const, letterSpacing: '0.2em' }
const section = { margin: '0 0 24px' }
const label = { fontSize: '11px', color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.25em', margin: '16px 0 4px' }
const value = { fontSize: '16px', color: '#1a1a1a', margin: '0 0 8px' }
const detailText = { fontSize: '15px', color: '#333', lineHeight: 1.7, margin: '0 0 24px', whiteSpace: 'pre-wrap' as const }
const hr = { border: 'none', borderTop: '1px solid #e5e5e5', margin: '24px 0' }
const link = { color: '#1a1a1a', textDecoration: 'underline' }
const footer = { fontSize: '11px', color: '#aaa', textAlign: 'center' as const, letterSpacing: '0.2em', textTransform: 'uppercase' as const }
