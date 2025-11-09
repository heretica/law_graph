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
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Main Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Play/Pause */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
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
            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Reset Animation"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          {/* Previous/Next Phase */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onSeekToPhase(Math.max(0, currentPhaseIndex - 1))}
              disabled={currentPhaseIndex <= 0}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Phase"
            >
              <BackwardIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSeekToPhase(Math.min(animationTimeline.length - 1, currentPhaseIndex + 1))}
              disabled={currentPhaseIndex >= animationTimeline.length - 1}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Phase"
            >
              <ForwardIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Speed Control */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
          <select
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-gray-900 dark:text-white"
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
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Timeline Progress</span>
          <span>{formatTime(overallProgress * totalDuration)} / {formatTime(totalDuration)}</span>
        </div>

        {/* Interactive Timeline */}
        <div
          className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
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
                className={`absolute top-0 h-6 rounded-lg transition-all ${
                  isCurrentPhase
                    ? 'bg-indigo-600 dark:bg-indigo-500'
                    : index < currentPhaseIndex
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-gray-300 dark:bg-gray-600'
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
                    className="absolute top-0 h-6 bg-indigo-800 dark:bg-indigo-400 rounded-lg transition-all"
                    style={{ width: `${currentProgress * 100}%` }}
                  />
                )}

                {/* Phase Label */}
                {phaseWidth > 15 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {phase.phase}
                  </div>
                )}
              </div>
            )
          })}

          {/* Overall Progress Indicator */}
          <div
            className="absolute top-0 w-1 h-6 bg-white border-2 border-gray-800 rounded-full transition-all z-10"
            style={{ left: `${overallProgress * 100}%`, transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Phase Labels Below Timeline */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          {animationTimeline.map((phase, index) => (
            <div
              key={phase.phase}
              className={`text-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 ${
                index === currentPhaseIndex ? 'font-medium text-indigo-600 dark:text-indigo-400' : ''
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
        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {animationTimeline[currentPhaseIndex]?.phase} Phase
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {(currentProgress * 100).toFixed(0)}% Complete
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {animationTimeline[currentPhaseIndex]?.description}
          </p>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}