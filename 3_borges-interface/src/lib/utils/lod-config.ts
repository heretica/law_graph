/**
 * LOD (Level of Detail) Configuration for Graph Performance Optimization
 *
 * Purpose: Reduce GPU load by adjusting visual detail based on camera distance
 * Feature: 006-graph-optimization
 *
 * Constitution Principles:
 * - Maintain visual clarity while optimizing performance
 * - Preserve relationship visibility at all zoom levels (Principe #4)
 */

/**
 * Detail settings for a specific LOD level
 */
export interface LODDetailSettings {
  /** Three.js sphere geometry resolution (segments) */
  nodeResolution: number;

  /** Enable animated particles along links */
  linkParticles: boolean;

  /** Speed of link particle animation (0 = disabled) */
  linkParticleSpeed: number;

  /** Node opacity (0.0 to 1.0) */
  nodeOpacity: number;
}

/**
 * Complete LOD configuration with distance thresholds and detail levels
 */
export interface LODConfig {
  /** Distance thresholds for LOD transitions */

  /** Maximum distance for high detail rendering */
  highDetailDistance: number;

  /** Maximum distance for medium detail rendering */
  mediumDetailDistance: number;

  /** Maximum distance for low detail rendering (beyond this: culling) */
  lowDetailDistance: number;

  /** High detail settings (closest view) */
  highDetail: LODDetailSettings;

  /** Medium detail settings (moderate distance) */
  mediumDetail: LODDetailSettings;

  /** Low detail settings (far view) */
  lowDetail: LODDetailSettings;
}

/**
 * LOD level identifier
 */
export type LODLevel = 'high' | 'medium' | 'low';

/**
 * Default LOD configuration
 *
 * Distance thresholds:
 * - High: < 200 units (detailed nodes, animated links)
 * - Medium: 200-500 units (simplified nodes, static links)
 * - Low: 500-1000 units (basic nodes, low opacity)
 */
export const DEFAULT_LOD_CONFIG: LODConfig = {
  // Distance thresholds
  highDetailDistance: 200,
  mediumDetailDistance: 500,
  lowDetailDistance: 1000,

  // High detail (distance < 200)
  highDetail: {
    nodeResolution: 16,      // Smooth spheres
    linkParticles: true,     // Animated particles
    linkParticleSpeed: 0.01, // Visible animation
    nodeOpacity: 1.0,        // Full opacity
  },

  // Medium detail (200 < distance < 500)
  mediumDetail: {
    nodeResolution: 8,       // Reduced polygon count
    linkParticles: false,    // No particles
    linkParticleSpeed: 0,    // No animation
    nodeOpacity: 0.9,        // Slightly transparent
  },

  // Low detail (distance > 500)
  lowDetail: {
    nodeResolution: 4,       // Minimal geometry
    linkParticles: false,    // No particles
    linkParticleSpeed: 0,    // No animation
    nodeOpacity: 0.7,        // More transparent
  },
};

/**
 * Determine LOD level based on camera distance
 *
 * @param distance - Camera distance from target
 * @param config - Optional custom LOD configuration (defaults to DEFAULT_LOD_CONFIG)
 * @returns LOD level identifier ('high', 'medium', or 'low')
 *
 * @example
 * ```typescript
 * const level = getLODLevel(150); // Returns 'high'
 * const level = getLODLevel(350); // Returns 'medium'
 * const level = getLODLevel(750); // Returns 'low'
 * ```
 */
export function getLODLevel(
  distance: number,
  config: LODConfig = DEFAULT_LOD_CONFIG
): LODLevel {
  if (distance < config.highDetailDistance) {
    return 'high';
  }

  if (distance < config.mediumDetailDistance) {
    return 'medium';
  }

  return 'low';
}

/**
 * Get LOD settings for the current camera distance
 *
 * @param distance - Camera distance from target
 * @param config - Optional custom LOD configuration (defaults to DEFAULT_LOD_CONFIG)
 * @returns LOD detail settings for the appropriate level
 *
 * @example
 * ```typescript
 * const settings = getLODSettings(150);
 * // Returns { nodeResolution: 16, linkParticles: true, ... }
 *
 * graph.nodeResolution(settings.nodeResolution);
 * graph.linkDirectionalParticles(settings.linkParticles ? 4 : 0);
 * ```
 */
export function getLODSettings(
  distance: number,
  config: LODConfig = DEFAULT_LOD_CONFIG
): LODDetailSettings {
  const level = getLODLevel(distance, config);

  switch (level) {
    case 'high':
      return config.highDetail;
    case 'medium':
      return config.mediumDetail;
    case 'low':
      return config.lowDetail;
  }
}

/**
 * Check if a distance is beyond the LOD culling threshold
 *
 * @param distance - Camera distance from target
 * @param config - Optional custom LOD configuration
 * @returns True if distance exceeds lowDetailDistance (candidate for culling)
 *
 * @example
 * ```typescript
 * if (shouldCullAtDistance(1200)) {
 *   // Hide nodes/links to save GPU resources
 * }
 * ```
 */
export function shouldCullAtDistance(
  distance: number,
  config: LODConfig = DEFAULT_LOD_CONFIG
): boolean {
  return distance > config.lowDetailDistance;
}

/**
 * Calculate smooth transition factor between LOD levels
 *
 * @param distance - Current camera distance
 * @param config - Optional custom LOD configuration
 * @returns Interpolation factor (0.0 to 1.0) for smooth transitions
 *
 * @example
 * ```typescript
 * const factor = getLODTransitionFactor(250); // Returns ~0.25 (25% into medium range)
 * const opacity = lerp(0.9, 0.7, factor); // Smooth opacity transition
 * ```
 */
export function getLODTransitionFactor(
  distance: number,
  config: LODConfig = DEFAULT_LOD_CONFIG
): number {
  const level = getLODLevel(distance, config);

  if (level === 'high') {
    // Transition from high to medium
    return Math.min(1.0, distance / config.highDetailDistance);
  }

  if (level === 'medium') {
    // Transition from medium to low
    const rangeStart = config.highDetailDistance;
    const rangeEnd = config.mediumDetailDistance;
    const rangeSize = rangeEnd - rangeStart;
    return Math.min(1.0, (distance - rangeStart) / rangeSize);
  }

  // Low detail
  const rangeStart = config.mediumDetailDistance;
  const rangeEnd = config.lowDetailDistance;
  const rangeSize = rangeEnd - rangeStart;
  return Math.min(1.0, (distance - rangeStart) / rangeSize);
}
