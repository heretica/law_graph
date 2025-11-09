'use client'

import { useState, useEffect } from 'react'

interface ProcessingPhase {
  name: string
  status: 'pending' | 'processing' | 'completed'
  duration?: number
  data?: any
}

interface ProgressiveDebugVisualizationProps {
  isVisible: boolean
  processingProgress: {
    phases: ProcessingPhase[]
    currentPhase: number
  }
  currentProcessingPhase: string | null
  onClose: () => void
}

export default function ProgressiveDebugVisualization({
  isVisible,
  processingProgress,
  currentProcessingPhase,
  onClose
}: ProgressiveDebugVisualizationProps) {
  const [dots, setDots] = useState('')

  // Animate loading dots for current processing phase
  useEffect(() => {
    if (!currentProcessingPhase) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [currentProcessingPhase])

  if (!isVisible) return null

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'processing': return '⚡'
      case 'pending': return '⭕'
      default: return '⭕'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'processing': return 'text-yellow-400'
      case 'pending': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'processing': return 'bg-yellow-500'
      case 'pending': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const totalPhases = processingProgress.phases.length
  const completedPhases = processingProgress.phases.filter(p => p.status === 'completed').length
  const overallProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-borges-dark border border-borges-secondary rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto text-white m-4">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-borges-light">🔬 Traitement GraphRAG en Cours</h2>
            <p className="text-gray-400">Suivi en temps réel des phases de traitement</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Overall Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progression Globale</span>
            <span className="text-sm text-gray-400">{completedPhases}/{totalPhases} phases</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="text-right text-sm text-gray-400 mt-1">
            {Math.round(overallProgress)}% terminé
          </div>
        </div>

        {/* Current Processing Phase Highlight */}
        {currentProcessingPhase && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg border border-blue-500">
            <div className="flex items-center space-x-3">
              <div className="animate-spin">⚡</div>
              <div>
                <div className="font-semibold text-lg">{currentProcessingPhase}</div>
                <div className="text-blue-300">En cours de traitement{dots}</div>
              </div>
            </div>
          </div>
        )}

        {/* Phase Timeline */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">📋 Timeline des Phases</h3>

          {processingProgress.phases.map((phase, index) => {
            const isActive = index === processingProgress.currentPhase

            return (
              <div key={index} className={`relative flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-yellow-900 to-orange-900 border border-yellow-500 scale-105'
                  : phase.status === 'completed'
                  ? 'bg-gradient-to-r from-green-900 to-emerald-900 border border-green-500'
                  : 'bg-borges-secondary'
              }`}>

                {/* Phase Icon */}
                <div className={`text-2xl ${isActive ? 'animate-pulse' : ''}`}>
                  {getPhaseIcon(phase.status)}
                </div>

                {/* Phase Info */}
                <div className="flex-1">
                  <div className={`font-medium ${getStatusColor(phase.status)}`}>
                    {phase.name}
                  </div>

                  {/* Phase Progress Bar */}
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(phase.status)} ${
                        phase.status === 'processing' ? 'animate-pulse' : ''
                      }`}
                      style={{
                        width: phase.status === 'completed' ? '100%'
                             : phase.status === 'processing' ? '60%'
                             : '0%'
                      }}
                    />
                  </div>
                </div>

                {/* Status Text */}
                <div className={`text-sm ${getStatusColor(phase.status)} min-w-[100px] text-right`}>
                  {phase.status === 'completed' && '✓ Terminé'}
                  {phase.status === 'processing' && 'En cours...'}
                  {phase.status === 'pending' && 'En attente'}
                </div>

                {/* Animation for active phase */}
                {isActive && (
                  <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg animate-pulse opacity-50" />
                )}
              </div>
            )
          })}
        </div>

        {/* Processing Details */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h4 className="font-semibold mb-2">ℹ️ Détails du Processus</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <div>• <strong>Analyse de la requête</strong>: Compréhension du contexte et des intentions</div>
            <div>• <strong>Sélection des entités</strong>: Identification des entités pertinentes dans le graphe</div>
            <div>• <strong>Analyse des communautés</strong>: Recherche des communautés liées au sujet</div>
            <div>• <strong>Cartographie des relations</strong>: Mapping des connexions entre entités</div>
            <div>• <strong>Synthèse textuelle</strong>: Génération de la réponse finale</div>
            <div>• <strong>Finalisation</strong>: Optimisation et formatage de la réponse</div>
          </div>
        </div>

        {/* Technical Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-borges-secondary p-3 rounded text-center">
            <div className="text-2xl font-bold text-blue-400">{processingProgress.phases.length}</div>
            <div className="text-xs text-gray-400">Phases Totales</div>
          </div>
          <div className="bg-borges-secondary p-3 rounded text-center">
            <div className="text-2xl font-bold text-green-400">{completedPhases}</div>
            <div className="text-xs text-gray-400">Phases Terminées</div>
          </div>
          <div className="bg-borges-secondary p-3 rounded text-center">
            <div className="text-2xl font-bold text-yellow-400">{processingProgress.currentPhase + 1}</div>
            <div className="text-xs text-gray-400">Phase Actuelle</div>
          </div>
        </div>
      </div>
    </div>
  )
}