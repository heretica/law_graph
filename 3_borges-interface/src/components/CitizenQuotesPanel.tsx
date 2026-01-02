'use client'

import { useEffect, useState } from 'react'

interface CitizenQuotesPanelProps {
  quotes: string[]
  currentIndex: number
  isVisible: boolean
}

// Famous Jacques Chirac quotes for civic entertainment during loading
const CHIRAC_QUOTES = [
  "Les promesses n'engagent que ceux qui les reçoivent.",
  "Il y a plus d'idées dans deux têtes que dans une.",
  "Qu'est-ce que vous voulez que ça me foute que les Français vivent comme des Japonais ?",
  "Je préfère les yeux dans les yeux et la poignée de main.",
  "Notre maison brûle et nous regardons ailleurs.",
  "Je suis pour ce que les gens sont contre et contre ce que les gens sont pour.",
  "Abracadabrantesque !",
  "La France ne peut pas accueillir toute la misère du monde.",
  "Je ne veux pas de Rafale dans mon jardin.",
  "Les emmerdes, ça vole toujours en escadrille.",
  "Il vaut mieux avoir affaire au Bon Dieu qu'à ses saints.",
  "Ce n'est pas à la grenouille qu'on demande de vider la mare.",
  "Mangez des pommes !",
  "Qu'est-ce qui peut arriver de pire ? D'être battu ? Et alors !",
  "Il y a plus de gens qui meurent de manger trop que de ne pas manger assez.",
  "La Corrèze avant le Zambèze.",
  "Tant que je serai là, il n'y aura pas de Rafale.",
  "Les Français, ils en ont marre des promesses. Ils veulent des actes.",
  "Sumo ? Non merci, déjà mangé.",
  "Le bruit et l'odeur.",
  "J'ai une passion pour la France, c'est vrai. C'est viscéral.",
  "La politique, ce n'est pas l'art de résoudre les problèmes, c'est l'art de faire taire ceux qui les posent.",
  "Un homme politique qui ne ment jamais n'est pas un homme politique.",
  "Les sondages, je les regarde comme ma fille regarde sa Game Boy.",
  "Je suis un passionné, pas un gestionnaire.",
  "La seule chose qui compte, c'est l'obstination.",
  "Un jour, les historiens se demanderont : mais qu'est-ce qu'ils foutaient ?",
  "Il n'y a que deux puissances au monde : le sabre et l'esprit. À la longue, le sabre est toujours vaincu par l'esprit.",
  "On ne gouverne pas avec des bons sentiments.",
  "La France a besoin de tout le monde, sauf des cons.",
  "Le courage, c'est de ne pas avoir peur de ses contradictions.",
  "Les technocrates, c'est comme les Daleks : ils ne pensent qu'à exterminer.",
  "Moi, je ne suis pas là pour être aimé, je suis là pour servir.",
  "L'immobilisme est en marche et rien ne pourra l'arrêter.",
  "La vie, c'est comme une bicyclette : il faut avancer pour ne pas perdre l'équilibre.",
  "Les Français veulent tout et son contraire. Ils veulent être tranquilles et que ça bouge.",
  "Un référendum, c'est simple : on pose une question, le peuple répond.",
  "La démocratie, c'est le gouvernement du peuple, par le peuple, pour le peuple. Mais le peuple, c'est moi.",
  "Je préfère la main tendue au poing levé.",
  "Les intellectuels, c'est comme les montres : ça retarde toujours.",
  "On ne fait pas d'omelette sans casser des œufs, mais on peut casser des œufs sans faire d'omelette.",
]

export default function CitizenQuotesPanel({ quotes, currentIndex, isVisible }: CitizenQuotesPanelProps) {
  const [chiraquoteIndex, setChiraquoteIndex] = useState(0)

  // Rotate through Chirac quotes every 4 seconds
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setChiraquoteIndex(prev => (prev + 1) % CHIRAC_QUOTES.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) {
    return null
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-4">
      {/* Quote display - compact */}
      <div className="relative">
        {/* Quote card - reduced padding */}
        <div className="bg-[#0a0a0a] border border-[#dbff3b]/40 rounded p-3 md:p-4">
          {/* Label - smaller */}
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#dbff3b]/50 to-transparent" />
            <span className="text-[#dbff3b] text-[10px] font-medium tracking-wider uppercase">
              Jacques Chirac
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#dbff3b]/50 to-transparent" />
          </div>

          {/* Quote text - smaller font */}
          <div className="relative min-h-[50px] flex items-center justify-center">
            {CHIRAC_QUOTES.map((quote, index) => (
              <p
                key={index}
                className={`
                  absolute inset-0 flex items-center justify-center text-center
                  text-xs md:text-sm leading-relaxed
                  text-[#dbff3b] font-light italic
                  transition-all duration-700 ease-in-out
                  ${index === chiraquoteIndex
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-95 pointer-events-none'
                  }
                `}
                style={{
                  textShadow: '0 0 20px rgba(219, 255, 59, 0.3)'
                }}
              >
                "{quote}"
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Progress indicator - compact */}
      <div className="flex justify-center items-center gap-1 mt-2">
        {CHIRAC_QUOTES.slice(0, Math.min(CHIRAC_QUOTES.length, 20)).map((_, index) => (
          <div
            key={index}
            className={`
              h-1 rounded-full transition-all duration-500
              ${index === chiraquoteIndex % 20
                ? 'w-8 bg-[#dbff3b]'
                : 'w-1 bg-[#dbff3b]/30'
              }
            `}
          />
        ))}
        {CHIRAC_QUOTES.length > 20 && (
          <span className="text-[#dbff3b]/40 text-xs ml-2">
            +{CHIRAC_QUOTES.length - 20}
          </span>
        )}
      </div>

      {/* Subtle pulse animation on the card border */}
      <style jsx>{`
        @keyframes borderPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(219, 255, 59, 0.1); }
          50% { box-shadow: 0 0 30px rgba(219, 255, 59, 0.2); }
        }
        div:has(> p) {
          animation: borderPulse 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
