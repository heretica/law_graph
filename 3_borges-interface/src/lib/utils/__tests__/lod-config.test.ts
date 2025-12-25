/**
 * Tests for LOD Configuration
 * Feature: 006-graph-optimization
 */

import {
  DEFAULT_LOD_CONFIG,
  getLODLevel,
  getLODSettings,
  shouldCullAtDistance,
  getLODTransitionFactor,
  type LODConfig,
  type LODLevel,
  type LODDetailSettings,
} from '../lod-config';

describe('LOD Configuration', () => {
  describe('DEFAULT_LOD_CONFIG', () => {
    it('should have correct distance thresholds', () => {
      expect(DEFAULT_LOD_CONFIG.highDetailDistance).toBe(200);
      expect(DEFAULT_LOD_CONFIG.mediumDetailDistance).toBe(500);
      expect(DEFAULT_LOD_CONFIG.lowDetailDistance).toBe(1000);
    });

    it('should have high detail settings', () => {
      expect(DEFAULT_LOD_CONFIG.highDetail.nodeResolution).toBe(16);
      expect(DEFAULT_LOD_CONFIG.highDetail.linkParticles).toBe(true);
      expect(DEFAULT_LOD_CONFIG.highDetail.linkParticleSpeed).toBe(0.01);
      expect(DEFAULT_LOD_CONFIG.highDetail.nodeOpacity).toBe(1.0);
    });

    it('should have medium detail settings', () => {
      expect(DEFAULT_LOD_CONFIG.mediumDetail.nodeResolution).toBe(8);
      expect(DEFAULT_LOD_CONFIG.mediumDetail.linkParticles).toBe(false);
      expect(DEFAULT_LOD_CONFIG.mediumDetail.linkParticleSpeed).toBe(0);
      expect(DEFAULT_LOD_CONFIG.mediumDetail.nodeOpacity).toBe(0.9);
    });

    it('should have low detail settings', () => {
      expect(DEFAULT_LOD_CONFIG.lowDetail.nodeResolution).toBe(4);
      expect(DEFAULT_LOD_CONFIG.lowDetail.linkParticles).toBe(false);
      expect(DEFAULT_LOD_CONFIG.lowDetail.linkParticleSpeed).toBe(0);
      expect(DEFAULT_LOD_CONFIG.lowDetail.nodeOpacity).toBe(0.7);
    });
  });

  describe('getLODLevel', () => {
    it('should return "high" for close distances', () => {
      expect(getLODLevel(50)).toBe('high');
      expect(getLODLevel(150)).toBe('high');
      expect(getLODLevel(199)).toBe('high');
    });

    it('should return "medium" for moderate distances', () => {
      expect(getLODLevel(200)).toBe('medium');
      expect(getLODLevel(350)).toBe('medium');
      expect(getLODLevel(499)).toBe('medium');
    });

    it('should return "low" for far distances', () => {
      expect(getLODLevel(500)).toBe('low');
      expect(getLODLevel(750)).toBe('low');
      expect(getLODLevel(999)).toBe('low');
      expect(getLODLevel(1500)).toBe('low');
    });

    it('should accept custom config', () => {
      const customConfig: LODConfig = {
        ...DEFAULT_LOD_CONFIG,
        highDetailDistance: 100,
        mediumDetailDistance: 300,
      };

      expect(getLODLevel(50, customConfig)).toBe('high');
      expect(getLODLevel(150, customConfig)).toBe('medium');
      expect(getLODLevel(400, customConfig)).toBe('low');
    });
  });

  describe('getLODSettings', () => {
    it('should return high detail settings for close distances', () => {
      const settings = getLODSettings(150);
      expect(settings.nodeResolution).toBe(16);
      expect(settings.linkParticles).toBe(true);
      expect(settings.linkParticleSpeed).toBe(0.01);
      expect(settings.nodeOpacity).toBe(1.0);
    });

    it('should return medium detail settings for moderate distances', () => {
      const settings = getLODSettings(350);
      expect(settings.nodeResolution).toBe(8);
      expect(settings.linkParticles).toBe(false);
      expect(settings.linkParticleSpeed).toBe(0);
      expect(settings.nodeOpacity).toBe(0.9);
    });

    it('should return low detail settings for far distances', () => {
      const settings = getLODSettings(750);
      expect(settings.nodeResolution).toBe(4);
      expect(settings.linkParticles).toBe(false);
      expect(settings.linkParticleSpeed).toBe(0);
      expect(settings.nodeOpacity).toBe(0.7);
    });
  });

  describe('shouldCullAtDistance', () => {
    it('should return false for distances within LOD range', () => {
      expect(shouldCullAtDistance(100)).toBe(false);
      expect(shouldCullAtDistance(500)).toBe(false);
      expect(shouldCullAtDistance(1000)).toBe(false);
    });

    it('should return true for distances beyond LOD range', () => {
      expect(shouldCullAtDistance(1001)).toBe(true);
      expect(shouldCullAtDistance(1500)).toBe(true);
      expect(shouldCullAtDistance(2000)).toBe(true);
    });
  });

  describe('getLODTransitionFactor', () => {
    it('should return 0-1 factor for high detail range', () => {
      expect(getLODTransitionFactor(0)).toBeCloseTo(0.0);
      expect(getLODTransitionFactor(100)).toBeCloseTo(0.5);
      expect(getLODTransitionFactor(200)).toBeCloseTo(1.0);
    });

    it('should return 0-1 factor for medium detail range', () => {
      const factor200 = getLODTransitionFactor(200);
      const factor350 = getLODTransitionFactor(350);
      const factor500 = getLODTransitionFactor(500);

      expect(factor200).toBeCloseTo(0.0);
      expect(factor350).toBeCloseTo(0.5);
      expect(factor500).toBeCloseTo(1.0);
    });

    it('should return 0-1 factor for low detail range', () => {
      const factor500 = getLODTransitionFactor(500);
      const factor750 = getLODTransitionFactor(750);
      const factor1000 = getLODTransitionFactor(1000);

      expect(factor500).toBeCloseTo(0.0);
      expect(factor750).toBeCloseTo(0.5);
      expect(factor1000).toBeCloseTo(1.0);
    });
  });
});
