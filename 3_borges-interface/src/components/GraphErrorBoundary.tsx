'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class GraphErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 GraphErrorBoundary: Error caught:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 GraphErrorBoundary: Component stack trace:', errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center h-96 bg-gray-900 rounded-lg border border-gray-700">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Graphe temporairement indisponible
              </h3>
              <p className="text-gray-400 mb-4">
                Le moteur de visualisation 3D rencontre des difficultés techniques.
              </p>
              <p className="text-sm text-gray-500">
                Erreur: {this.state.error?.message || 'Erreur inconnue'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}