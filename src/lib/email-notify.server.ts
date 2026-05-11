import * as React from 'react'
import { render as renderAsync } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'blackforestmediagroupcom'
const SENDER_DOMAIN = 'notify.blackforestmediagroup.com'
const FROM_DOMAIN = 'notify.blackforestmediagroup.com'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function enqueueTemplateEmail(
  templateName: string,
  templateData: Record<string, any>,
  overrideRecipient?: string,
) {
  try {
    const template = TEMPLATES[templateName]
    if (!template) {
      console.error('enqueueTemplateEmail: template not found', { templateName })
      return { ok: false, reason: 'template_not_found' }
    }
    const recipient = template.to || overrideRecipient
    if (!recipient) return { ok: false, reason: 'no_recipient' }
    const normalized = recipient.toLowerCase()

    // Suppression check
    const { data: suppressed } = await supabaseAdmin
      .from('suppressed_emails')
      .select('id')
      .eq('email', normalized)
      .maybeSingle()
    if (suppressed) return { ok: false, reason: 'suppressed' }

    // Get/create unsubscribe token
    let unsubscribeToken: string
    const { data: existing } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token, used_at')
      .eq('email', normalized)
      .maybeSingle()
    if (existing?.token && !existing.used_at) {
      unsubscribeToken = existing.token
    } else {
      unsubscribeToken = generateToken()
      await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .upsert(
          { token: unsubscribeToken, email: normalized },
          { onConflict: 'email', ignoreDuplicates: true },
        )
      const { data: stored } = await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('email', normalized)
        .maybeSingle()
      if (stored?.token) unsubscribeToken = stored.token
    }

    const element = React.createElement(template.component, templateData)
    const html = await renderAsync(element)
    const text = await renderAsync(element, { plainText: true })
    const subject =
      typeof template.subject === 'function' ? template.subject(templateData) : template.subject

    const messageId = crypto.randomUUID()

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: recipient,
      status: 'pending',
    })

    const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: templateName,
        idempotency_key: messageId,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })
    if (enqueueError) {
      console.error('enqueueTemplateEmail: enqueue failed', { enqueueError })
      return { ok: false, reason: 'enqueue_failed' }
    }
    return { ok: true }
  } catch (err) {
    console.error('enqueueTemplateEmail: unexpected error', err)
    return { ok: false, reason: 'exception' }
  }
}
