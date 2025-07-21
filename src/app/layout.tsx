import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { DM_Mono } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/AuthProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: '400'
})

export const metadata: Metadata = {
  title: 'Crafty',
  description:
    'A modern chat interface for AI agents built with Next.js, Tailwind CSS, and TypeScript. This template provides a ready-to-use UI for interacting with Agno agents.'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${dmMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
