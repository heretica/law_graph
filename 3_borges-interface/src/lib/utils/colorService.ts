/**
 * Color service that provides consistent entity coloring between graph visualization and text highlighting
 * This ensures end-to-end interpretability from RAG response to graph nodes
 */

interface EntityColorInfo {
  id: string
  type: string
  color: string
  score: number
  description?: string
}

export class ColorService {
  /**
   * Get base colors for entity types (matching GraphHighlighter)
   */
  private getEntityBaseColor(entityType: string): { r: number; g: number; b: number } {
    const baseColors = {
      'Personnes': { r: 255, g: 107, b: 107 },
      'Lieux': { r: 78, g: 205, b: 196 },
      'Événements': { r: 69, g: 183, b: 209 },
      'Concepts': { r: 150, g: 206, b: 180 },
      'Organisations': { r: 254, g: 202, b: 87 },
      'Livres': { r: 255, g: 159, b: 243 },
      'default': { r: 168, g: 168, b: 168 }
    }
    return baseColors[entityType as keyof typeof baseColors] || baseColors.default
  }

  /**
   * Generate intelligence-based color (matching getIntelligenceColor from GraphHighlighter)
   */
  getIntelligenceColor(entityType: string, intelligenceScore: number, reasoningImportance: number = 0): string {
    const baseColor = this.getEntityBaseColor(entityType)

    // Match the GraphHighlighter logic exactly
    const intensityMultiplier = 0.7 + (intelligenceScore * 0.6)
    const brightnessBoost = reasoningImportance * 50

    const r = Math.min(255, Math.floor(baseColor.r * intensityMultiplier + brightnessBoost))
    const g = Math.min(255, Math.floor(baseColor.g * intensityMultiplier + brightnessBoost))
    const b = Math.min(255, Math.floor(baseColor.b * intensityMultiplier + brightnessBoost))

    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * Map entity type from GraphRAG to graph visualization type
   * This handles potential differences between GraphRAG entity types and graph node types
   */
  private mapEntityType(graphragType: string): string {
    const typeMapping: Record<string, string> = {
      'PERSON': 'Personnes',
      'PEOPLE': 'Personnes',
      'PERSONNES': 'Personnes',
      'LOCATION': 'Lieux',
      'PLACE': 'Lieux',
      'LIEUX': 'Lieux',
      'EVENT': 'Événements',
      'EVENEMENTS': 'Événements',
      'ÉVÉNEMENTS': 'Événements',
      'CONCEPT': 'Concepts',
      'CONCEPTS': 'Concepts',
      'ORGANIZATION': 'Organisations',
      'ORG': 'Organisations',
      'ORGANISATIONS': 'Organisations',
      'BOOK': 'Livres',
      'LIVRE': 'Livres',
      'LIVRES': 'Livres',
      // Default fallback
      'UNKNOWN': 'Concepts'
    }

    // Try direct mapping first
    const directMatch = typeMapping[graphragType.toUpperCase()]
    if (directMatch) return directMatch

    // Try partial matching for compound types
    const upperType = graphragType.toUpperCase()
    for (const [key, value] of Object.entries(typeMapping)) {
      if (upperType.includes(key) || key.includes(upperType)) {
        return value
      }
    }

    // Default fallback
    return 'Concepts'
  }

  /**
   * Enrich GraphRAG entities with color metadata for text highlighting
   */
  enrichEntitiesWithColors(entities: Array<{
    id: string
    type: string
    description?: string
    rank?: number
    order?: number
    score: number
  }>): EntityColorInfo[] {
    return entities.map(entity => {
      // Map GraphRAG entity type to graph visualization type
      const visualizationType = this.mapEntityType(entity.type)

      // Calculate reasoning importance based on GraphRAG metrics (matching GraphHighlighter logic)
      const orderImportance = entity.order !== undefined ?
        1.0 - (entity.order / entities.length) : 0.5
      const scoreImportance = entity.score || 0
      const centralityBonus = entities.length > 5 && (entity.order || 0) <= 2 ? 0.3 : 0
      const reasoningImportance = Math.min(
        (orderImportance * 0.4 + scoreImportance * 0.6 + centralityBonus),
        1.0
      )

      // Generate intelligence color matching GraphHighlighter
      const color = this.getIntelligenceColor(
        visualizationType,
        entity.score,
        reasoningImportance
      )

      return {
        id: entity.id,
        type: visualizationType,
        color: color,
        score: entity.score,
        description: entity.description
      }
    })
  }

  /**
   * Get entity color by type and score (for backwards compatibility)
   */
  getEntityColor(entityType: string, score: number): string {
    return this.getIntelligenceColor(entityType, score, score)
  }

  /**
   * Get all available entity types with their base colors
   */
  getEntityTypeColors(): Array<{ type: string; color: string }> {
    const types = ['Personnes', 'Lieux', 'Événements', 'Concepts', 'Organisations', 'Livres']
    return types.map(type => ({
      type,
      color: this.getIntelligenceColor(type, 0.5, 0)
    }))
  }
}

export const colorService = new ColorService()
export type { EntityColorInfo }