import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chronova — AI-Powered Scheduling Assistant',
  description:
    'An intelligent scheduling and task-prioritization assistant that actively organizes your day based on urgency, impact, energy levels, and available time.',
  keywords: ['productivity', 'scheduling', 'AI', 'time management', 'calendar', 'tasks'],
  authors: [{ name: 'Chronova Team' }],
  creator: 'Chronova',
  publisher: 'Chronova',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://chronova.app',
    title: 'Chronova — AI-Powered Scheduling Assistant',
    description:
      'An intelligent scheduling and task-prioritization assistant that actively organizes your day.',
    siteName: 'Chronova',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chronova — AI-Powered Scheduling Assistant',
    description: 'An intelligent scheduling and task-prioritization assistant.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
