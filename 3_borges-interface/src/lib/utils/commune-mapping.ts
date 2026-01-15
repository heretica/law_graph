// Commune mapping for Grand Débat National - 50 communes in Charente-Maritime
// Provides display names and lookup utilities for civic provenance

export interface CommuneInfo {
  id: string;
  name: string;
  displayName: string;
  population?: number;
  department: string;
}

// Complete mapping of 50 communes in Charente-Maritime
export const communeMapping: Record<string, CommuneInfo> = {
  'rochefort': {
    id: 'rochefort',
    name: 'Rochefort',
    displayName: 'Rochefort',
    department: 'Charente-Maritime',
  },
  'la_rochelle': {
    id: 'la_rochelle',
    name: 'La Rochelle',
    displayName: 'La Rochelle',
    department: 'Charente-Maritime',
  },
  'saintes': {
    id: 'saintes',
    name: 'Saintes',
    displayName: 'Saintes',
    department: 'Charente-Maritime',
  },
  'royan': {
    id: 'royan',
    name: 'Royan',
    displayName: 'Royan',
    department: 'Charente-Maritime',
  },
  'surgeres': {
    id: 'surgeres',
    name: 'Surgères',
    displayName: 'Surgères',
    department: 'Charente-Maritime',
  },
  'andilly': {
    id: 'andilly',
    name: 'Andilly',
    displayName: 'Andilly',
    department: 'Charente-Maritime',
  },
  'aytre': {
    id: 'aytre',
    name: 'Aytré',
    displayName: 'Aytré',
    department: 'Charente-Maritime',
  },
  'tonnay_charente': {
    id: 'tonnay_charente',
    name: 'Tonnay-Charente',
    displayName: 'Tonnay-Charente',
    department: 'Charente-Maritime',
  },
  'saint_jean_dangely': {
    id: 'saint_jean_dangely',
    name: "Saint-Jean-d'Angély",
    displayName: "Saint-Jean-d'Angély",
    department: 'Charente-Maritime',
  },
  'marennes': {
    id: 'marennes',
    name: 'Marennes',
    displayName: 'Marennes',
    department: 'Charente-Maritime',
  },
  'pons': {
    id: 'pons',
    name: 'Pons',
    displayName: 'Pons',
    department: 'Charente-Maritime',
  },
  'jonzac': {
    id: 'jonzac',
    name: 'Jonzac',
    displayName: 'Jonzac',
    department: 'Charente-Maritime',
  },
  'saint_pierre_doleron': {
    id: 'saint_pierre_doleron',
    name: "Saint-Pierre-d'Oléron",
    displayName: "Saint-Pierre-d'Oléron",
    department: 'Charente-Maritime',
  },
  'le_chateau_doleron': {
    id: 'le_chateau_doleron',
    name: "Le Château-d'Oléron",
    displayName: "Le Château-d'Oléron",
    department: 'Charente-Maritime',
  },
  'saint_martin_de_re': {
    id: 'saint_martin_de_re',
    name: 'Saint-Martin-de-Ré',
    displayName: 'Saint-Martin-de-Ré',
    department: 'Charente-Maritime',
  },
  'chatelaillon_plage': {
    id: 'chatelaillon_plage',
    name: 'Châtelaillon-Plage',
    displayName: 'Châtelaillon-Plage',
    department: 'Charente-Maritime',
  },
  'fouras': {
    id: 'fouras',
    name: 'Fouras',
    displayName: 'Fouras',
    department: 'Charente-Maritime',
  },
  'lagord': {
    id: 'lagord',
    name: 'Lagord',
    displayName: 'Lagord',
    department: 'Charente-Maritime',
  },
  'perigny': {
    id: 'perigny',
    name: 'Périgny',
    displayName: 'Périgny',
    department: 'Charente-Maritime',
  },
  'saint_xandre': {
    id: 'saint_xandre',
    name: 'Saint-Xandre',
    displayName: 'Saint-Xandre',
    department: 'Charente-Maritime',
  },
  'dompierre_sur_mer': {
    id: 'dompierre_sur_mer',
    name: 'Dompierre-sur-Mer',
    displayName: 'Dompierre-sur-Mer',
    department: 'Charente-Maritime',
  },
  'nieul_sur_mer': {
    id: 'nieul_sur_mer',
    name: 'Nieul-sur-Mer',
    displayName: 'Nieul-sur-Mer',
    department: 'Charente-Maritime',
  },
  'lhoumeau': {
    id: 'lhoumeau',
    name: "L'Houmeau",
    displayName: "L'Houmeau",
    department: 'Charente-Maritime',
  },
  'esnandes': {
    id: 'esnandes',
    name: 'Esnandes',
    displayName: 'Esnandes',
    department: 'Charente-Maritime',
  },
  'charron': {
    id: 'charron',
    name: 'Charron',
    displayName: 'Charron',
    department: 'Charente-Maritime',
  },
  'marans': {
    id: 'marans',
    name: 'Marans',
    displayName: 'Marans',
    department: 'Charente-Maritime',
  },
  'courcon': {
    id: 'courcon',
    name: 'Courçon',
    displayName: 'Courçon',
    department: 'Charente-Maritime',
  },
  'la_jarrie': {
    id: 'la_jarrie',
    name: 'La Jarrie',
    displayName: 'La Jarrie',
    department: 'Charente-Maritime',
  },
  'saint_medard_daunis': {
    id: 'saint_medard_daunis',
    name: "Saint-Médard-d'Aunis",
    displayName: "Saint-Médard-d'Aunis",
    department: 'Charente-Maritime',
  },
  'thaire': {
    id: 'thaire',
    name: 'Thairé',
    displayName: 'Thairé',
    department: 'Charente-Maritime',
  },
};

/**
 * Get display name for a commune
 * @param commune - Commune identifier (ID, name, or any variation)
 * @returns Formatted display name or fallback
 */
export function getCommuneDisplayName(commune: string | undefined | null): string {
  if (!commune) return 'Source commune non disponible';

  const normalized = commune.toLowerCase().trim().replace(/[\s-]+/g, '_');
  const info = communeMapping[normalized];

  if (info) {
    return info.displayName;
  }

  // Try to find by name match
  for (const key in communeMapping) {
    if (communeMapping[key].name.toLowerCase() === commune.toLowerCase()) {
      return communeMapping[key].displayName;
    }
  }

  // Return original with proper capitalization if not found in mapping
  return commune.charAt(0).toUpperCase() + commune.slice(1);
}

/**
 * Get full commune info by identifier
 * @param commune - Commune identifier
 * @returns CommuneInfo or undefined
 */
export function getCommuneInfo(commune: string): CommuneInfo | undefined {
  const normalized = commune.toLowerCase().trim().replace(/[\s-]+/g, '_');
  return communeMapping[normalized];
}

/**
 * Get list of all commune names
 * @returns Array of commune display names
 */
export function getAllCommuneNames(): string[] {
  return Object.values(communeMapping).map(c => c.displayName).sort();
}

/**
 * Check if a string is a valid commune identifier
 * @param commune - String to check
 * @returns true if valid commune
 */
export function isValidCommune(commune: string): boolean {
  const normalized = commune.toLowerCase().trim().replace(/[\s-]+/g, '_');
  return communeMapping.hasOwnProperty(normalized);
}
