'use client'

import React, { useState } from 'react'
import LoadingWheel3D from './LoadingWheel3D'

type HighlightArea = 'welcome' | 'book-select' | 'all-books' | 'query' | 'ascendant' | 'descendant' | 'search-btn' | 'graph' | 'panels' | 'graphrag-explain' | 'results-highlight'

interface TutorialStep {
  title: string
  description: string
  highlight: HighlightArea
}

interface TutorialOverlayProps {
  onComplete: () => void
  isDataLoading: boolean
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Bienvenue dans Le Graphe de Borges',
    description: 'Une cartographie littéraire vivante qui révèle les connexions cachées entre vos livres.',
    highlight: 'welcome'
  },
  {
    title: 'Sélectionnez un livre',
    description: 'Choisissez une œuvre dans le menu déroulant pour concentrer votre exploration sur un livre spécifique.',
    highlight: 'book-select'
  },
  {
    title: 'Ou explorez tout le catalogue',
    description: 'Cliquez sur "📚 Tout le catalogue" pour interroger l\'ensemble de votre bibliothèque et découvrir les connexions inter-livres.',
    highlight: 'all-books'
  },
  {
    title: 'Posez votre question',
    description: 'Écrivez votre question en langage naturel. Le GraphRAG analysera vos livres pour trouver les réponses.',
    highlight: 'query'
  },
  {
    title: 'Mode Ascendant (Local)',
    description: 'Part des chunks de texte pour remonter vers les entités. Idéal pour des questions précises sur des passages spécifiques. Explore en profondeur un contexte local.',
    highlight: 'ascendant'
  },
  {
    title: 'Mode Descendant (Global)',
    description: 'Part des entités de haut niveau pour descendre vers les textes. Idéal pour des questions thématiques ou conceptuelles. Explore la structure globale du graphe.',
    highlight: 'descendant'
  },
  {
    title: 'Lancez la recherche',
    description: 'Cliquez sur "Recherche Borges" pour exécuter votre requête. Le système construira un chemin à travers le graphe de connaissances.',
    highlight: 'search-btn'
  },
  {
    title: 'Qu\'est-ce que le GraphRAG ?',
    description: 'Le GraphRAG (Graph Retrieval-Augmented Generation) extrait des entités et relations de vos textes pour créer un graphe de connaissances. Il utilise ce graphe pour répondre à vos questions en naviguant les connexions entre concepts.',
    highlight: 'graphrag-explain'
  },
  {
    title: 'Comprendre les résultats',
    description: 'Les passages pertinents sont affichés avec du texte surligné en jaune. Ce surlignage indique les mots-clés et entités que le GraphRAG a identifiés comme répondant à votre question.',
    highlight: 'results-highlight'
  },
  {
    title: 'Explorez le graphe',
    description: 'Le graphe 3D affiche les entités (personnages, lieux, concepts) et leurs relations. Cliquez sur un nœud pour voir ses détails et connexions.',
    highlight: 'graph'
  },
  {
    title: 'Naviguez dans les panneaux',
    description: 'Explorez la provenance complète : des nœuds aux relations, des relations aux chunks de texte source. Chaque élément est cliquable pour une navigation de bout en bout.',
    highlight: 'panels'
  }
]

const InterfaceSchematic: React.FC<{ highlightedArea: HighlightArea }> = ({ highlightedArea }) => {
  const getHighlightClass = (area: HighlightArea) =>
    highlightedArea === area ? 'stroke-sky-400 stroke-2 animate-pulse' : 'stroke-borges-light-muted/30 stroke-1'

  const getAreaOpacity = (area: HighlightArea) =>
    highlightedArea === area ? 'opacity-100' : 'opacity-40'

  const getFillHighlight = (area: HighlightArea) =>
    highlightedArea === area ? 'fill-sky-400/20' : 'fill-borges-secondary'

  return (
    <svg viewBox="0 0 510 320" className="w-full max-w-2xl mx-auto">
      {/* Background panel */}
      <rect x="10" y="10" width="490" height="300" rx="8"
        className="fill-borges-dark stroke-borges-border stroke-1" />

      {/* Header area with title */}
      <g className={`transition-opacity duration-300 ${getAreaOpacity('welcome')}`}>
        <text x="250" y="32" textAnchor="middle"
          className="fill-borges-light text-xs font-medium">
          Le Graphe de Borges
        </text>
      </g>

      {/* ===== SEARCH BAR ROW ===== */}

      {/* Book selector dropdown */}
      <g className={`transition-opacity duration-300 ${getAreaOpacity('book-select')}`}>
        <rect x="20" y="45" width="90" height="26" rx="4"
          className={`${getFillHighlight('book-select')} transition-all duration-300 ${getHighlightClass('book-select')}`} />
        <text x="30" y="62" className="fill-borges-light text-[9px]">A Rebours...</text>
        <path d="M95 56 L100 61 L105 56" className="stroke-borges-light-muted stroke-1 fill-none" />
      </g>

      {/* All Books button */}
      <g className={`transition-opacity duration-300 ${getAreaOpacity('all-books')}`}>
        <rect x="115" y="45" width="85" height="26" rx="4"
          className={`${getFillHighlight('all-books')} transition-all duration-300 ${getHighlightClass('all-books')}`} />
        <text x="125" y="62" className="fill-borges-light text-[9px]">📚 Catalogue</text>
      </g>

      {/* Query input */}
      <g className={`transition-opacity duration-300 ${getAreaOpacity('query')}`}>
        <rect x="205" y="45" width="120" height="26" rx="4"
          className={`${getFillHighlight('query')} transition-all duration-300 ${getHighlightClass('query')}`} />
        <text x="215" y="62" className="fill-borges-light-muted text-[9px]">Posez une question...</text>
      </g>

      {/* Mode toggle container */}
      <g className={`transition-opacity duration-300 ${highlightedArea === 'ascendant' || highlightedArea === 'descendant' ? 'opacity-100' : 'opacity-40'}`}>
        <rect x="330" y="45" width="80" height="26" rx="4"
          className="fill-borges-secondary stroke-borges-border stroke-1" />

        {/* Ascendant button */}
        <g className={`${getAreaOpacity('ascendant')}`}>
          <rect x="332" y="47" width="38" height="22" rx="3"
            className={`${highlightedArea === 'ascendant' ? 'fill-borges-light' : 'fill-transparent'} transition-all duration-300 ${getHighlightClass('ascendant')}`} />
          <text x="340" y="61" className={`text-[7px] ${highlightedArea === 'ascendant' ? 'fill-borges-dark' : 'fill-borges-light-muted'}`}>↑ Asc</text>
        </g>

        {/* Descendant button */}
        <g className={`${getAreaOpacity('descendant')}`}>
          <rect x="370" y="47" width="38" height="22" rx="3"
            className={`${highlightedArea === 'descendant' ? 'fill-borges-light' : 'fill-transparent'} transition-all duration-300 ${getHighlightClass('descendant')}`} />
          <text x="376" y="61" className={`text-[7px] ${highlightedArea === 'descendant' ? 'fill-borges-dark' : 'fill-borges-light-muted'}`}>↓ Desc</text>
        </g>
      </g>

      {/* Search button */}
      <g className={`transition-opacity duration-300 ${getAreaOpacity('search-btn')}`}>
        <rect x="415" y="45" width="70" height="26" rx="4"
          className={`${highlightedArea === 'search-btn' ? 'fill-borges-accent' : 'fill-borges-accent/60'} transition-all duration-300 ${getHighlightClass('search-btn')}`} />
        <text x="450" y="62" textAnchor="middle" className="fill-borges-dark text-[7px] font-medium">Recherche</text>
      </g>

      {/* ===== MAIN CONTENT AREA ===== */}

      {/* Graph area */}
      <g className={`transition-opacity duration-300 ${getAreaOpacity('graph')}`}>
        <rect x="20" y="80" width="320" height="180" rx="6"
          className={`fill-borges-dark transition-all duration-300 ${getHighlightClass('graph')}`} />

        {/* Schematic nodes and edges */}
        {/* Central book node */}
        <circle cx="170" cy="170" r="20"
          className="fill-borges-accent/20 stroke-borges-accent stroke-2" />
        <text x="170" y="175" textAnchor="middle" className="fill-borges-accent text-[12px]">📖</text>

        {/* Person nodes */}
        <circle cx="100" cy="120" r="14"
          className="fill-rose-500/20 stroke-rose-400 stroke-1" />
        <text x="100" y="124" textAnchor="middle" className="fill-rose-400 text-[8px]">👤</text>

        <circle cx="240" cy="120" r="14"
          className="fill-rose-500/20 stroke-rose-400 stroke-1" />
        <text x="240" y="124" textAnchor="middle" className="fill-rose-400 text-[8px]">👤</text>

        {/* Location node */}
        <circle cx="80" cy="200" r="12"
          className="fill-sky-500/20 stroke-sky-400 stroke-1" />
        <text x="80" y="204" textAnchor="middle" className="fill-sky-400 text-[8px]">📍</text>

        {/* Concept node */}
        <circle cx="260" cy="200" r="12"
          className="fill-emerald-500/20 stroke-emerald-400 stroke-1" />
        <text x="260" y="204" textAnchor="middle" className="fill-emerald-400 text-[8px]">💡</text>

        {/* Event node */}
        <circle cx="170" cy="235" r="10"
          className="fill-violet-500/20 stroke-violet-400 stroke-1" />

        {/* Edges */}
        <line x1="114" y1="128" x2="152" y2="158" className="stroke-borges-light-muted/50 stroke-1" />
        <line x1="226" y1="128" x2="188" y2="158" className="stroke-borges-light-muted/50 stroke-1" />
        <line x1="92" y1="194" x2="153" y2="175" className="stroke-borges-light-muted/50 stroke-1" />
        <line x1="248" y1="194" x2="187" y2="175" className="stroke-borges-light-muted/50 stroke-1" />
        <line x1="170" y1="225" x2="170" y2="190" className="stroke-borges-light-muted/50 stroke-1" />
        <line x1="100" y1="134" x2="100" y2="106" className="stroke-borges-light-muted/30 stroke-1" />
        <line x1="240" y1="134" x2="260" y2="188" className="stroke-borges-light-muted/30 stroke-1" />
      </g>

      {/* ===== SIDE PANELS ===== */}
      <g className={`transition-opacity duration-300 ${getAreaOpacity('panels')}`}>
        {/* Entity detail panel */}
        <rect x="345" y="80" width="120" height="55" rx="4"
          className={`${getFillHighlight('panels')} transition-all duration-300 ${getHighlightClass('panels')}`} />
        <text x="355" y="95" className="fill-borges-light text-[8px] font-medium">Entité</text>
        <line x1="355" y1="100" x2="455" y2="100" className="stroke-borges-border stroke-1" />
        <text x="355" y="112" className="fill-borges-light-muted text-[7px]">Des Esseintes</text>
        <text x="355" y="122" className="fill-borges-light-muted text-[6px]">Type: Personne</text>
        <text x="355" y="130" className="fill-borges-light-muted text-[6px]">Relations: 12</text>

        {/* Relationships panel */}
        <rect x="345" y="140" width="120" height="55" rx="4"
          className={`${getFillHighlight('panels')} transition-all duration-300 ${getHighlightClass('panels')}`} />
        <text x="355" y="155" className="fill-borges-light text-[8px] font-medium">Relations</text>
        <line x1="355" y1="160" x2="455" y2="160" className="stroke-borges-border stroke-1" />
        <text x="355" y="172" className="fill-borges-light-muted text-[6px]">→ HABITE → Paris</text>
        <text x="355" y="182" className="fill-borges-light-muted text-[6px]">→ POSSÈDE → Château</text>
        <text x="355" y="192" className="fill-borges-light-muted text-[6px]">→ ADMIRE → Baudelaire</text>

        {/* Chunk panel */}
        <rect x="345" y="200" width="120" height="60" rx="4"
          className={`${getFillHighlight('panels')} transition-all duration-300 ${getHighlightClass('panels')}`} />
        <text x="355" y="215" className="fill-borges-light text-[8px] font-medium">Chunk source</text>
        <line x1="355" y1="220" x2="455" y2="220" className="stroke-borges-border stroke-1" />
        <text x="355" y="232" className="fill-borges-light-muted text-[6px]">"Le duc Jean des</text>
        <text x="355" y="241" className="fill-borges-light-muted text-[6px]">Esseintes, héritier</text>
        <text x="355" y="250" className="fill-borges-light-muted text-[6px]">d'une famille..."</text>
      </g>

      {/* Legend at bottom */}
      <g className="opacity-60">
        <circle cx="30" cy="275" r="5" className="fill-rose-400" />
        <text x="40" y="278" className="fill-borges-light-muted text-[7px]">Personne</text>

        <circle cx="90" cy="275" r="5" className="fill-sky-400" />
        <text x="100" y="278" className="fill-borges-light-muted text-[7px]">Lieu</text>

        <circle cx="140" cy="275" r="5" className="fill-emerald-400" />
        <text x="150" y="278" className="fill-borges-light-muted text-[7px]">Concept</text>

        <circle cx="200" cy="275" r="5" className="fill-borges-accent" />
        <text x="210" y="278" className="fill-borges-light-muted text-[7px]">Livre</text>

        <circle cx="250" cy="275" r="5" className="fill-violet-400" />
        <text x="260" y="278" className="fill-borges-light-muted text-[7px]">Événement</text>
      </g>

      {/* ===== GRAPHRAG EXPLANATION OVERLAY ===== */}
      <g className={`transition-opacity duration-300 ${highlightedArea === 'graphrag-explain' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Semi-transparent overlay */}
        <rect x="40" y="90" width="280" height="160" rx="8"
          className="fill-borges-dark/95 stroke-sky-400 stroke-2 animate-pulse" />

        {/* GraphRAG flow diagram */}
        <text x="180" y="115" textAnchor="middle" className="fill-sky-400 text-[10px] font-medium">GraphRAG - Comment ça marche ?</text>

        {/* Step 1: Text */}
        <rect x="55" y="130" width="55" height="30" rx="4" className="fill-borges-secondary stroke-borges-border" />
        <text x="82" y="143" textAnchor="middle" className="fill-borges-light text-[7px]">📄 Texte</text>
        <text x="82" y="153" textAnchor="middle" className="fill-borges-light-muted text-[5px]">livres, chunks</text>

        {/* Arrow 1 */}
        <path d="M115 145 L130 145" className="stroke-sky-400 stroke-1" markerEnd="url(#arrowhead)" />
        <text x="122" y="140" textAnchor="middle" className="fill-sky-400 text-[5px]">extraction</text>

        {/* Step 2: Graph */}
        <rect x="135" y="130" width="55" height="30" rx="4" className="fill-borges-secondary stroke-borges-border" />
        <text x="162" y="143" textAnchor="middle" className="fill-borges-light text-[7px]">🔗 Graphe</text>
        <text x="162" y="153" textAnchor="middle" className="fill-borges-light-muted text-[5px]">entités, relations</text>

        {/* Arrow 2 */}
        <path d="M195 145 L210 145" className="stroke-sky-400 stroke-1" />
        <text x="202" y="140" textAnchor="middle" className="fill-sky-400 text-[5px]">navigation</text>

        {/* Step 3: Answer */}
        <rect x="215" y="130" width="55" height="30" rx="4" className="fill-borges-secondary stroke-borges-border" />
        <text x="242" y="143" textAnchor="middle" className="fill-borges-light text-[7px]">💡 Réponse</text>
        <text x="242" y="153" textAnchor="middle" className="fill-borges-light-muted text-[5px]">contextualisée</text>

        {/* Question input */}
        <rect x="135" y="175" width="130" height="20" rx="4" className="fill-borges-accent/20 stroke-borges-accent stroke-1" />
        <text x="200" y="188" textAnchor="middle" className="fill-borges-accent text-[7px]">❓ Votre question</text>

        {/* Arrow from question to graph */}
        <path d="M162 175 L162 162" className="stroke-borges-accent stroke-1" />

        {/* Benefits */}
        <text x="70" y="215" className="fill-borges-light-muted text-[6px]">✓ Connexions inter-livres</text>
        <text x="70" y="228" className="fill-borges-light-muted text-[6px]">✓ Traçabilité des sources</text>
        <text x="180" y="215" className="fill-borges-light-muted text-[6px]">✓ Contexte enrichi</text>
        <text x="180" y="228" className="fill-borges-light-muted text-[6px]">✓ Relations sémantiques</text>
      </g>

      {/* ===== RESULTS WITH HIGHLIGHTED TEXT ===== */}
      <g className={`transition-opacity duration-300 ${highlightedArea === 'results-highlight' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Overlay on chunk panel area */}
        <rect x="40" y="90" width="280" height="160" rx="8"
          className="fill-borges-dark/95 stroke-yellow-400 stroke-2 animate-pulse" />

        <text x="180" y="115" textAnchor="middle" className="fill-yellow-400 text-[10px] font-medium">Texte surligné = Pertinence</text>

        {/* Example text chunk with highlighting */}
        <rect x="55" y="128" width="250" height="70" rx="4" className="fill-borges-secondary stroke-borges-border" />
        <text x="65" y="143" className="fill-borges-light-muted text-[7px]">« Le duc Jean</text>
        {/* Highlighted part */}
        <rect x="118" y="133" width="75" height="14" rx="2" className="fill-yellow-400/30" />
        <text x="120" y="143" className="fill-yellow-400 text-[7px] font-medium">des Esseintes</text>
        <text x="195" y="143" className="fill-borges-light-muted text-[7px]">, héritier</text>

        <text x="65" y="158" className="fill-borges-light-muted text-[7px]">d'une famille déchue, vivait</text>
        {/* Another highlight */}
        <rect x="188" y="148" width="40" height="14" rx="2" className="fill-yellow-400/30" />
        <text x="190" y="158" className="fill-yellow-400 text-[7px] font-medium">seul</text>
        <text x="210" y="158" className="fill-borges-light-muted text-[7px]">dans</text>

        <text x="65" y="173" className="fill-borges-light-muted text-[7px]">une</text>
        <rect x="80" y="163" width="70" height="14" rx="2" className="fill-yellow-400/30" />
        <text x="82" y="173" className="fill-yellow-400 text-[7px] font-medium">demeure isolée</text>
        <text x="152" y="173" className="fill-borges-light-muted text-[7px]">, cultivant ses</text>

        <text x="65" y="188" className="fill-borges-light-muted text-[7px]">obsessions esthétiques... »</text>

        {/* Legend for highlighting */}
        <rect x="55" y="205" width="12" height="12" rx="2" className="fill-yellow-400/30 stroke-yellow-400 stroke-1" />
        <text x="72" y="214" className="fill-borges-light-muted text-[7px]">= entités/concepts identifiés par le GraphRAG</text>

        <text x="55" y="235" className="fill-borges-light-muted text-[6px]">Cliquez sur le texte surligné pour voir les entités correspondantes dans le graphe</text>
      </g>
    </svg>
  )
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete, isDataLoading }) => {
  const [step, setStep] = useState(0)

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1)
    } else {
      localStorage.setItem('borges-tutorial-seen', 'true')
      onComplete()
    }
  }

  const handleSkip = () => {
    localStorage.setItem('borges-tutorial-seen', 'true')
    onComplete()
  }

  const currentStep = tutorialSteps[step]
  const isLastStep = step === tutorialSteps.length - 1
  // Always allow proceeding - if data is still loading, hexagon animation will show
  const canProceed = true

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Hexagon animation - smaller */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12">
            <LoadingWheel3D />
          </div>
        </div>

        {/* Schematic Interface Diagram */}
        <div className="mb-6">
          <InterfaceSchematic highlightedArea={currentStep.highlight} />
        </div>

        {/* Tutorial Text */}
        <div className="text-center">
          <h2 className="text-lg font-medium text-borges-light mb-2">
            {currentStep.title}
          </h2>
          <p className="text-borges-light-muted text-sm mb-5 max-w-md mx-auto leading-relaxed">
            {currentStep.description}
          </p>

          {/* Progress dots */}
          <div className="flex gap-1.5 justify-center mb-4">
            {tutorialSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'bg-borges-light scale-125'
                    : i < step
                      ? 'bg-borges-light/60'
                      : 'bg-borges-light/30'
                }`}
                aria-label={`Étape ${i + 1}`}
              />
            ))}
          </div>

          {/* Step counter */}
          <p className="text-borges-light-muted/50 text-xs mb-3">
            Étape {step + 1}/{tutorialSteps.length}
          </p>

          {/* Continue button */}
          <button
            onClick={handleNext}
            className="px-6 py-2 rounded-borges-sm font-medium transition-all duration-300 bg-borges-light text-borges-dark hover:bg-borges-light/90"
          >
            {isLastStep ? 'Commencer l\'exploration →' : 'Continuer →'}
          </button>

          {/* Skip link */}
          <div className="mt-3">
            <button
              onClick={handleSkip}
              className="text-borges-light-muted/50 text-xs hover:text-borges-light-muted transition-colors underline"
            >
              Passer le tutoriel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorialOverlay
