import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '🏛️ Bibliothèque de Borges',
  description: 'Une exploration interactive des connexions infinies entre les livres',
  authors: [{ name: 'Arthur Sarazin' }],
  keywords: ['Borges', 'bibliothèque', 'graph', 'littérature', 'connexions'],
  openGraph: {
    title: '🏛️ Bibliothèque de Borges',
    description: 'Une exploration interactive des connexions infinies entre les livres',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🏛️ Bibliothèque de Borges',
    description: 'Une exploration interactive des connexions infinies entre les livres',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} min-h-screen bg-borges-dark text-borges-light`}>
        {children}
      </body>
    </html>
  )
}