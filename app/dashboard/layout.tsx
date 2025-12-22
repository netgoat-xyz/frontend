import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'
import NavigationTop from '@/components/elements/NavigationTop'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Web Analytics Dashboard',
  description: 'Recreated Vercel-style dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-neutral-950 h-screen text-white antialiased transform-gpu transition-all duration-200 min-h-full min-w-full h-full w-full`}>
              <NavigationTop />
              <main className='p-6'>
                {children}
                </main>
      </body>
    </html>
  )
}