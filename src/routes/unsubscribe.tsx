import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const Route = createFileRoute('/unsubscribe')({
  head: () => ({
    meta: [{ title: 'Unsubscribe — Black Forest Signature' }],
  }),
  component: UnsubscribePage,
})

function UnsubscribePage() {
  const [state, setState] = useState<
    'loading' | 'ready' | 'already' | 'invalid' | 'success' | 'error'
  >('loading')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token')
    if (!t) {
      setState('invalid')
      return
    }
    setToken(t)
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) setState('ready')
        else if (d.reason === 'already_unsubscribed') setState('already')
        else setState('invalid')
      })
      .catch(() => setState('error'))
  }, [])

  const confirm = async () => {
    if (!token) return
    setState('loading')
    try {
      const r = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const d = await r.json()
      if (d.success) setState('success')
      else if (d.reason === 'already_unsubscribed') setState('already')
      else setState('error')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="pt-40 pb-32 px-6 max-w-xl mx-auto text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6">
          Email Preferences
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-accent mb-8">Unsubscribe</h1>

        {state === 'loading' && <p className="text-muted-foreground">Checking your link…</p>}
        {state === 'invalid' && (
          <p className="text-muted-foreground">This unsubscribe link is invalid or expired.</p>
        )}
        {state === 'already' && (
          <p className="text-muted-foreground">You have already been unsubscribed.</p>
        )}
        {state === 'ready' && (
          <>
            <p className="text-muted-foreground mb-8">
              Click below to confirm and stop receiving emails from us.
            </p>
            <button
              onClick={confirm}
              className="bg-accent text-accent-foreground text-xs tracking-[0.3em] uppercase py-4 px-10 hover:bg-accent/90 transition-colors"
            >
              Confirm Unsubscribe
            </button>
          </>
        )}
        {state === 'success' && (
          <p className="text-muted-foreground">You've been unsubscribed. We're sorry to see you go.</p>
        )}
        {state === 'error' && (
          <p className="text-muted-foreground">Something went wrong. Please try again later.</p>
        )}
      </section>
      <SiteFooter />
    </div>
  )
}
