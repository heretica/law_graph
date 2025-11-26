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
      case 'completed': return 'text-borges-accent'
      case 'processing': return 'text-borges-light'
      case 'pending': return 'text-borges-muted'
      default: return 'text-borges-muted'
    }
  }

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-borges-accent'
      case 'processing': return 'bg-borges-light-muted'
      case 'pending': return 'bg-borges-secondary'
      default: return 'bg-borges-secondary'
    }
  }

  const totalPhases = processingProgress.phases.length
  const completedPhases = processingProgress.phases.filter(p => p.status === 'completed').length
  const overallProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0

  return (
    <div className="borges-modal-overlay flex items-center justify-center">
      <div className="bg-borges-dark border border-borges-border rounded-borges-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto m-4">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-h2 text-borges-light">GraphRAG Processing</h2>
            <p className="text-borges-muted">Real-time processing phases</p>
          </div>
          <button
            onClick={onClose}
            className="text-borges-muted hover:text-borges-light text-2xl"
          >
            ×
          </button>
        </div>

        {/* Overall Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-borges-light">Overall Progress</span>
            <span className="text-sm text-borges-muted">{completedPhases}/{totalPhases} phases</span>
          </div>
          <div className="w-full bg-borges-secondary rounded-full h-3">
            <div
              className="bg-borges-accent h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="text-right text-sm text-borges-muted mt-1">
            {Math.round(overallProgress)}% complete
          </div>
        </div>

        {/* Current Processing Phase Highlight */}
        {currentProcessingPhase && (
          <div className="mb-6 p-4 bg-borges-secondary rounded-borges-md border border-borges-accent">
            <div className="flex items-center space-x-3">
              <div className="animate-spin text-borges-accent">*</div>
              <div>
                <div className="font-medium text-lg text-borges-light">{currentProcessingPhase}</div>
                <div className="text-borges-accent">Processing{dots}</div>
              </div>
            </div>
          </div>
        )}

        {/* Phase Timeline */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-borges-light mb-4">Phase Timeline</h3>

          {processingProgress.phases.map((phase, index) => {
            const isActive = index === processingProgress.currentPhase

            return (
              <div key={index} className={`relative flex items-center space-x-4 p-4 rounded-borges-md transition-all duration-300 ${
                isActive
                  ? 'bg-borges-secondary border border-borges-accent scale-[1.02]'
                  : phase.status === 'completed'
                  ? 'bg-borges-secondary border border-borges-accent/50'
                  : 'bg-borges-secondary border border-borges-border'
              }`}>

                {/* Phase Icon */}
                <div className={`text-xl ${isActive ? 'animate-pulse' : ''}`}>
                  {getPhaseIcon(phase.status)}
                </div>

                {/* Phase Info */}
                <div className="flex-1">
                  <div className={`font-medium ${getStatusColor(phase.status)}`}>
                    {phase.name}
                  </div>

                  {/* Phase Progress Bar */}
                  <div className="mt-2 w-full bg-borges-dark rounded-full h-2">
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
                  {phase.status === 'completed' && 'Complete'}
                  {phase.status === 'processing' && 'Processing...'}
                  {phase.status === 'pending' && 'Pending'}
                </div>

                {/* Animation for active phase */}
                {isActive && (
                  <div className="absolute inset-0 border border-borges-accent rounded-borges-md animate-pulse opacity-50" />
                )}
              </div>
            )
          })}
        </div>

        {/* Processing Details */}
        <div className="mt-8 p-4 bg-borges-secondary rounded-borges-md border border-borges-border">
          <h4 className="font-medium text-borges-light mb-2">Process Details</h4>
          <div className="text-sm text-borges-light-muted space-y-1">
            <div>• <span className="text-borges-light">Query Analysis</span>: Understanding context and intent</div>
            <div>• <span className="text-borges-light">Entity Selection</span>: Identifying relevant graph entities</div>
            <div>• <span className="text-borges-light">Community Analysis</span>: Finding related communities</div>
            <div>• <span className="text-borges-light">Relationship Mapping</span>: Mapping entity connections</div>
            <div>• <span className="text-borges-light">Text Synthesis</span>: Generating final response</div>
            <div>• <span className="text-borges-light">Finalization</span>: Optimizing and formatting</div>
          </div>
        </div>

        {/* Technical Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-borges-secondary p-3 rounded-borges-md border border-borges-border text-center">
            <div className="text-2xl font-bold text-borges-light">{processingProgress.phases.length}</div>
            <div className="text-xs text-borges-muted">Total Phases</div>
          </div>
          <div className="bg-borges-secondary p-3 rounded-borges-md border border-borges-border text-center">
            <div className="text-2xl font-bold text-borges-accent">{completedPhases}</div>
            <div className="text-xs text-borges-muted">Completed</div>
          </div>
          <div className="bg-borges-secondary p-3 rounded-borges-md border border-borges-border text-center">
            <div className="text-2xl font-bold text-borges-light">{processingProgress.currentPhase + 1}</div>
            <div className="text-xs text-borges-muted">Current Phase</div>
          </div>
        </div>
      </div>
    </div>
  )
}