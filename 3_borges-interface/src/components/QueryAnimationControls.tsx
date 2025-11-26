'use client'

import { useState, useEffect } from 'react'
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import type { AnimationPhase } from '@/lib/services/reconciliation'

interface QueryAnimationControlsProps {
  animationTimeline: AnimationPhase[]
  isPlaying: boolean
  currentPhase: string
  currentProgress: number // 0-1 for current phase progress
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSeekToPhase: (phaseIndex: number) => void
  onSpeedChange?: (speed: number) => void
  className?: string
}

export default function QueryAnimationControls({
  animationTimeline,
  isPlaying,
  currentPhase,
  currentProgress,
  onPlay,
  onPause,
  onReset,
  onSeekToPhase,
  onSpeedChange,
  className = ''
}: QueryAnimationControlsProps) {
  const [speed, setSpeed] = useState(1.0)
  const [isDragging, setIsDragging] = useState(false)

  const currentPhaseIndex = animationTimeline.findIndex(phase => phase.phase === currentPhase)
  const totalDuration = animationTimeline.reduce((sum, phase) => sum + phase.duration, 0)

  // Calculate overall progress (across all phases)
  let overallProgress = 0
  for (let i = 0; i < currentPhaseIndex; i++) {
    overallProgress += animationTimeline[i].duration
  }
  if (currentPhaseIndex >= 0) {
    overallProgress += animationTimeline[currentPhaseIndex].duration * currentProgress
  }
  overallProgress = overallProgress / totalDuration

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
    onSpeedChange?.(newSpeed)
  }

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const percentage = x / rect.width

    // Find which phase this percentage corresponds to
    let accumulatedTime = 0
    let targetPhaseIndex = 0

    for (let i = 0; i < animationTimeline.length; i++) {
      const phaseEnd = (accumulatedTime + animationTimeline[i].duration) / totalDuration
      if (percentage <= phaseEnd) {
        targetPhaseIndex = i
        break
      }
      accumulatedTime += animationTimeline[i].duration
      targetPhaseIndex = i + 1
    }

    onSeekToPhase(Math.min(targetPhaseIndex, animationTimeline.length - 1))
  }

  const formatTime = (milliseconds: number) => {
    const seconds = milliseconds / 1000
    return `${seconds.toFixed(1)}s`
  }

  return (
    <div className={`bg-borges-secondary rounded-borges-md p-4 space-y-4 border border-borges-border ${className}`}>
      {/* Main Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Play/Pause */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-borges-accent text-borges-dark hover:opacity-90 transition-colors"
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="flex items-center justify-center w-8 h-8 rounded-borges-sm bg-borges-dark text-borges-light-muted hover:bg-borges-dark-hover transition-colors border border-borges-border"
            title="Reset Animation"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          {/* Previous/Next Phase */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onSeekToPhase(Math.max(0, currentPhaseIndex - 1))}
              disabled={currentPhaseIndex <= 0}
              className="flex items-center justify-center w-8 h-8 rounded-borges-sm bg-borges-dark text-borges-light-muted hover:bg-borges-dark-hover transition-colors border border-borges-border disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Phase"
            >
              <BackwardIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSeekToPhase(Math.min(animationTimeline.length - 1, currentPhaseIndex + 1))}
              disabled={currentPhaseIndex >= animationTimeline.length - 1}
              className="flex items-center justify-center w-8 h-8 rounded-borges-sm bg-borges-dark text-borges-light-muted hover:bg-borges-dark-hover transition-colors border border-borges-border disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Phase"
            >
              <ForwardIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Speed Control */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-borges-muted">Speed:</span>
          <select
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="text-sm bg-borges-dark border border-borges-border rounded-borges-sm px-2 py-1 text-borges-light"
          >
            <option value={0.5}>0.5x</option>
            <option value={1.0}>1.0x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2.0x</option>
            <option value={3.0}>3.0x</option>
          </select>
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-borges-muted">
          <span>Timeline Progress</span>
          <span>{formatTime(overallProgress * totalDuration)} / {formatTime(totalDuration)}</span>
        </div>

        {/* Interactive Timeline */}
        <div
          className="relative h-6 bg-borges-dark rounded-borges-sm cursor-pointer border border-borges-border"
          onClick={handleTimelineClick}
        >
          {/* Phase Segments */}
          {animationTimeline.map((phase, index) => {
            const phaseStart = animationTimeline.slice(0, index).reduce((sum, p) => sum + p.duration, 0) / totalDuration * 100
            const phaseWidth = (phase.duration / totalDuration) * 100
            const isCurrentPhase = index === currentPhaseIndex

            return (
              <div
                key={phase.phase}
                className={`absolute top-0 h-6 rounded-borges-sm transition-all ${
                  isCurrentPhase
                    ? 'bg-borges-accent'
                    : index < currentPhaseIndex
                    ? 'bg-borges-accent/60'
                    : 'bg-borges-secondary'
                }`}
                style={{
                  left: `${phaseStart}%`,
                  width: `${phaseWidth}%`,
                }}
                title={`${phase.description} (${formatTime(phase.duration)})`}
              >
                {/* Current Phase Progress */}
                {isCurrentPhase && (
                  <div
                    className="absolute top-0 h-6 bg-borges-accent/80 rounded-borges-sm transition-all"
                    style={{ width: `${currentProgress * 100}%` }}
                  />
                )}

                {/* Phase Label */}
                {phaseWidth > 15 && (
                  <div className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${isCurrentPhase ? 'text-borges-dark' : 'text-borges-light'}`}>
                    {phase.phase}
                  </div>
                )}
              </div>
            )
          })}

          {/* Overall Progress Indicator */}
          <div
            className="absolute top-0 w-1 h-6 bg-borges-light border-2 border-borges-dark rounded-full transition-all z-10"
            style={{ left: `${overallProgress * 100}%`, transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Phase Labels Below Timeline */}
        <div className="flex justify-between text-xs text-borges-muted">
          {animationTimeline.map((phase, index) => (
            <div
              key={phase.phase}
              className={`text-center cursor-pointer hover:text-borges-light-muted ${
                index === currentPhaseIndex ? 'font-medium text-borges-accent' : ''
              }`}
              onClick={() => onSeekToPhase(index)}
              style={{
                width: `${(phase.duration / totalDuration) * 100}%`,
                marginLeft: index === 0 ? '0' : undefined
              }}
            >
              {phase.phase}
            </div>
          ))}
        </div>
      </div>

      {/* Current Phase Info */}
      {currentPhaseIndex >= 0 && (
        <div className="bg-borges-dark rounded-borges-md p-3 border border-borges-border">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-borges-light">
              {animationTimeline[currentPhaseIndex]?.phase} Phase
            </h4>
            <span className="text-xs text-borges-muted">
              {(currentProgress * 100).toFixed(0)}% Complete
            </span>
          </div>
          <p className="text-sm text-borges-light-muted">
            {animationTimeline[currentPhaseIndex]?.description}
          </p>
          <div className="mt-2 w-full bg-borges-secondary rounded-full h-2">
            <div
              className="bg-borges-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}