'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { authClient } from '@/lib/auth-client'

export default function Error({
  error,
}: {
  error: Error & { digest?: string }
}) {
  const t = useTranslations('ErrorPages.banned')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-background font-sans text-foreground antialiased">
      {/* Spacey Grid Background */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial Gradient for "Space" Depth */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle_at_center, transparent 0%, var(--background) 100%)',
        }}
      />

      <div className="z-10 flex max-w-md flex-col items-center space-y-8 px-4 text-center w-full">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {t('title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <button
          onClick={() => {
            authClient.signOut().then(() => {
              window.location.href = '/'
            })
          }}
          className="rounded-full bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t('signOut')}
        </button>
      </div>
    </div>
  )
}
