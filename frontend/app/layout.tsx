import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Armed Forces Welfare Management System',
  description: 'Comprehensive welfare management system for armed forces personnel and their families',
  generator: 'Next.js',
  keywords: ['armed forces', 'welfare', 'management', 'military', 'benefits'],
  authors: [{ name: 'Armed Forces Welfare Department' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning={true}
      >        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Script 
          src="/extension-fix.js" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
