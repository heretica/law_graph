'use client'

import { useEffect, useState } from 'react'

interface CitizenQuotesPanelProps {
  quotes: string[]
  currentIndex: number
  isVisible: boolean
}

// Famous French political quotes for civic entertainment during loading
const POLITICAL_QUOTES = [
  // Jacques Chirac - Le grand classique
  { author: "Jacques Chirac", quote: "Les promesses n'engagent que ceux qui les reçoivent." },
  { author: "Jacques Chirac", quote: "Abracadabrantesque !" },
  { author: "Jacques Chirac", quote: "Les emmerdes, ça vole toujours en escadrille." },
  { author: "Jacques Chirac", quote: "Mangez des pommes !" },
  { author: "Jacques Chirac", quote: "Notre maison brûle et nous regardons ailleurs." },
  { author: "Jacques Chirac", quote: "Sumo ? Non merci, déjà mangé." },
  { author: "Jacques Chirac", quote: "La Corrèze avant le Zambèze." },
  { author: "Jacques Chirac", quote: "Il vaut mieux avoir affaire au Bon Dieu qu'à ses saints." },
  { author: "Jacques Chirac", quote: "Les sondages, je les regarde comme ma fille regarde sa Game Boy." },
  { author: "Jacques Chirac", quote: "L'immobilisme est en marche et rien ne pourra l'arrêter." },

  // François Hollande - Le roi de l'autodérision
  { author: "François Hollande", quote: "Moi, président de la République..." },
  { author: "François Hollande", quote: "Je n'aime pas les riches." },
  { author: "François Hollande", quote: "Dans la vie, il y a trois sortes de gens : ceux qui comptent et ceux qui ne comptent pas." },
  { author: "François Hollande", quote: "Mon véritable adversaire, c'est le monde de la finance." },
  { author: "François Hollande", quote: "Ça ne fait pas rêver." },
  { author: "François Hollande", quote: "Je suis un président normal." },
  { author: "François Hollande", quote: "La gauche c'est moi, la droite c'est eux." },
  { author: "François Hollande", quote: "Les sans-dents." },
  { author: "François Hollande", quote: "Je vais vous dire, les journalistes, c'est comme les saucisses : moins vous savez comment c'est fait, mieux vous vous portez." },
  { author: "François Hollande", quote: "Maintenant ça va mieux." },
  { author: "François Hollande", quote: "Je ne suis pas favori. Mais je gagne souvent quand je ne suis pas favori." },
  { author: "François Hollande", quote: "En ce moment je suis avec Julie. Enfin, je suis avec Julie, vous voyez ce que je veux dire..." },
  { author: "François Hollande", quote: "Le changement, c'est maintenant !" },
  { author: "François Hollande", quote: "J'ai fait quinze ans d'ENA. Ce n'est quand même pas pour devenir chômeur !" },
  { author: "François Hollande", quote: "Les fonctionnaires, c'est un peu comme les livres d'une bibliothèque : les plus haut placés sont ceux qui servent le moins." },

  // Nicolas Sarkozy - L'énergie incarnée
  { author: "Nicolas Sarkozy", quote: "Casse-toi, pauv' con !" },
  { author: "Nicolas Sarkozy", quote: "Si vous n'aimez pas ça, vous prenez la porte !" },
  { author: "Nicolas Sarkozy", quote: "Ensemble, tout devient possible." },
  { author: "Nicolas Sarkozy", quote: "Travailler plus pour gagner plus." },
  { author: "Nicolas Sarkozy", quote: "La France, on l'aime ou on la quitte." },
  { author: "Nicolas Sarkozy", quote: "Quand il n'y en a plus, il y en a encore !" },
  { author: "Nicolas Sarkozy", quote: "Je vais vous dire : moi, je ne suis pas inquiet." },
  { author: "Nicolas Sarkozy", quote: "Karcher !" },
  { author: "Nicolas Sarkozy", quote: "On ne subit pas son destin, on le choisit." },

  // Jean-Luc Mélenchon - La passion révolutionnaire
  { author: "Jean-Luc Mélenchon", quote: "La République, c'est moi !" },
  { author: "Jean-Luc Mélenchon", quote: "Je suis un homme en colère." },
  { author: "Jean-Luc Mélenchon", quote: "Vous êtes une petite frappe de la politique !" },
  { author: "Jean-Luc Mélenchon", quote: "Qu'ils viennent me chercher !" },
  { author: "Jean-Luc Mélenchon", quote: "La France insoumise !" },
  { author: "Jean-Luc Mélenchon", quote: "Le peuple, rien que le peuple, tout le peuple !" },

  // Valéry Giscard d'Estaing - L'élégance aristocratique
  { author: "Valéry Giscard d'Estaing", quote: "Vous n'avez pas le monopole du cœur." },
  { author: "Valéry Giscard d'Estaing", quote: "Au revoir." },
  { author: "Valéry Giscard d'Estaing", quote: "La France est notre patrie, l'Europe est notre avenir." },

  // François Mitterrand - Le sphinx
  { author: "François Mitterrand", quote: "Vous avez juridiquement tort parce que vous êtes politiquement minoritaire." },
  { author: "François Mitterrand", quote: "Donnez-moi du temps." },
  { author: "François Mitterrand", quote: "La France ne le sait pas, mais nous sommes en guerre avec l'Amérique." },

  // Georges Clemenceau - Le Tigre
  { author: "Georges Clemenceau", quote: "La guerre ! C'est une chose trop grave pour la confier à des militaires." },
  { author: "Georges Clemenceau", quote: "Il est plus facile de faire la guerre que la paix." },

  // Charles de Gaulle - Le fondateur
  { author: "Charles de Gaulle", quote: "Comment voulez-vous gouverner un pays qui compte 246 variétés de fromages ?" },
  { author: "Charles de Gaulle", quote: "Des chercheurs qui cherchent, on en trouve. Des chercheurs qui trouvent, on en cherche." },
  { author: "Charles de Gaulle", quote: "Vaste programme !" },
  { author: "Charles de Gaulle", quote: "La politique ne consiste pas à faire taire les problèmes mais à faire taire ceux qui les posent." },

  // Édouard Philippe - Le style maîtrisé
  { author: "Édouard Philippe", quote: "Je ne suis pas Emmanuel Macron, et lui non plus d'ailleurs." },
  { author: "Édouard Philippe", quote: "Être Premier ministre, c'est comme être entraîneur de football : vous avez tout le monde contre vous." },

  // Marine Le Pen - La tribune
  { author: "Marine Le Pen", quote: "Les Français d'abord !" },
  { author: "Marine Le Pen", quote: "Je suis la candidate du peuple." },
]

export default function CitizenQuotesPanel({ quotes, currentIndex, isVisible }: CitizenQuotesPanelProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)

  // Rotate through political quotes every 4 seconds
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % POLITICAL_QUOTES.length)
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
          {/* Label - smaller, dynamic author */}
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#dbff3b]/50 to-transparent" />
            <span className="text-[#dbff3b] text-[10px] font-medium tracking-wider uppercase transition-all duration-700">
              {POLITICAL_QUOTES[quoteIndex].author}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#dbff3b]/50 to-transparent" />
          </div>

          {/* Quote text - smaller font */}
          <div className="relative min-h-[50px] flex items-center justify-center">
            {POLITICAL_QUOTES.map((item, index) => (
              <p
                key={index}
                className={`
                  absolute inset-0 flex items-center justify-center text-center
                  text-xs md:text-sm leading-relaxed
                  text-[#dbff3b] font-light italic
                  transition-all duration-700 ease-in-out
                  ${index === quoteIndex
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-95 pointer-events-none'
                  }
                `}
                style={{
                  textShadow: '0 0 20px rgba(219, 255, 59, 0.3)'
                }}
              >
                "{item.quote}"
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Progress indicator - compact */}
      <div className="flex justify-center items-center gap-1 mt-2">
        {POLITICAL_QUOTES.slice(0, Math.min(POLITICAL_QUOTES.length, 20)).map((_, index) => (
          <div
            key={index}
            className={`
              h-1 rounded-full transition-all duration-500
              ${index === quoteIndex % 20
                ? 'w-8 bg-[#dbff3b]'
                : 'w-1 bg-[#dbff3b]/30'
              }
            `}
          />
        ))}
        {POLITICAL_QUOTES.length > 20 && (
          <span className="text-[#dbff3b]/40 text-xs ml-2">
            +{POLITICAL_QUOTES.length - 20}
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
