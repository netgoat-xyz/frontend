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
  const t = useTranslations('ErrorPages.forbidden')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-black font-sans text-white antialiased">
      {/* Spacey Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      ></div>
      
      {/* Radial Gradient for "Space" Depth */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)]"></div>

      <div className="z-10 flex max-w-md flex-col w-full items-center space-y-8 px-4 text-center">
        {/* GIF Container with Glow */}
        <div className="group relative mx-auto h-64 w-full overflow-hidden rounded-xl border border-white/10 shadow-[0_0_50px_-12px_rgba(255,255,255,0.2)] transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_80px_-20px_rgba(255,255,255,0.4)]">
          <Image
            src="https://c.tenor.com/qkPV6_DL-NAAAAAd/tenor.gif"
            alt={t('imageAlt')}
            fill
            className="object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
            unoptimized
            loading='eager'
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-gray-500">
            403
          </h1>
          <h2 className="text-2xl font-medium tracking-tight text-gray-200">
            {t('title')}
          </h2>
          <p className="text-sm text-gray-500">
            {t('description')}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="rounded-full bg-white px-8 py-2.5 text-sm font-semibold text-black transition-all hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black"
        >
          {t('action')}
        </button>
      </div>
    </div>
  )
}