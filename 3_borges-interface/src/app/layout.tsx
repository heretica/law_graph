import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heretica-sans',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heretica-serif',
})

export const metadata: Metadata = {
  title: 'Grand Débat National - Heretica',
  description: 'Research is young and daring. Exploration interactive des connexions citoyennes du Grand Débat 2019.',
  authors: [{ name: 'Heretica' }],
  keywords: ['Grand Débat', 'citoyenneté', 'graph', 'GraphRAG', 'Heretica', 'recherche', 'données citoyennes'],
  openGraph: {
    title: 'Grand Débat National - Heretica',
    description: 'Research is young and daring. Exploration interactive des connexions citoyennes.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grand Débat National - Heretica',
    description: 'Research is young and daring. Exploration interactive des connexions citoyennes.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="light">
      <body className={`${inter.variable} ${playfair.variable} font-heretica-sans min-h-screen bg-heretica-white text-heretica-text`}>
        {children}
      </body>
    </html>
  )
}
