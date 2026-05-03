'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('ErrorPages.serverError')

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
        {/* GIF Container with Glow */}
        <div className="group relative mx-auto h-64 min-w-full overflow-hidden rounded-xl border border-border/60 shadow-xl transition-all duration-500 hover:border-border hover:shadow-2xl">
          <Image
            src="https://c.tenor.com/qkPV6_DL-NAAAAAd/tenor.gif"
            alt={t('imageAlt')}
            fill
            loading="eager"
            className="object-cover opacity-90 select-none transition-opacity duration-500 group-hover:opacity-100"
            unoptimized
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-foreground to-muted-foreground">
            500
          </h1>
          <h2 className="text-2xl font-medium tracking-tight text-foreground">
            {t('title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="rounded-full bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t('action')}
        </button>
      </div>
    </div>
  )
}