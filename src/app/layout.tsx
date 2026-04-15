import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: {
    default: 'Tall Order | Dating for Tall People',
    template: '%s | Tall Order',
  },
  description: 'A privacy-first dating and social app for tall people. Find your people.',
  metadataBase: new URL('https://tallorder.date'),
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      { rel: 'mask-icon', url: '/images/app-icon.png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tallorder.date',
    title: 'Tall Order | Dating for Tall People',
    description: 'A privacy-first dating and social app for tall people.',
    siteName: 'Tall Order',
    images: [{ url: '/images/logo-dark.png', width: 1178, height: 318, alt: 'Tall Order' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tall Order | Dating for Tall People',
    description: 'A privacy-first dating and social app for tall people.',
    images: ['/images/logo-dark.png'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1C1917" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1C1917] focus:text-white focus:rounded-lg focus:font-semibold"
        >
          Skip to main content
        </a>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  )
}
