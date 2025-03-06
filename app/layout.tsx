import './globals.css'
import type { Metadata } from 'next'
import { SupabaseProvider } from '../contexts/SupabaseContext';

export const metadata: Metadata = {
  title: 'WhatsApp Clone',
  description: 'A WhatsApp clone built with Next.js and Tailwind CSS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}