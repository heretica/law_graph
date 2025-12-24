import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-datack',
})

export const metadata: Metadata = {
  title: 'Grand Débat National - Datack',
  description: 'Exploration interactive des connexions citoyennes du Grand Débat 2019',
  authors: [{ name: 'Datack' }],
  keywords: ['Grand Débat', 'citoyenneté', 'graph', 'GraphRAG', 'Datack', 'données citoyennes'],
  openGraph: {
    title: 'Grand Débat National - Datack',
    description: 'Exploration interactive des connexions citoyennes du Grand Débat 2019',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grand Débat National - Datack',
    description: 'Exploration interactive des connexions citoyennes du Grand Débat 2019',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} font-datack min-h-screen bg-datack-black text-datack-light`}>
        {children}
      </body>
    </html>
  )
}
