import type { Metadata } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-borges',
})

export const metadata: Metadata = {
  title: 'Le graphe de Borges',
  description: 'Une exploration interactive des connexions infinies entre les livres',
  authors: [{ name: 'Arthur Sarazin' }],
  keywords: ['Borges', 'bibliothèque', 'graph', 'littérature', 'connexions'],
  openGraph: {
    title: 'Le graphe de Borges',
    description: 'Une exploration interactive des connexions infinies entre les livres',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Le graphe de Borges',
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
      <body className={`${cormorantGaramond.variable} font-borges min-h-screen bg-borges-dark text-borges-light`}>
        {children}
      </body>
    </html>
  )
}