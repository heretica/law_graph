/**
 * Entity Type Colors and Configuration
 * Maps all 62+ entity types to distinct colors and styles
 * Based on API nano_graphrag entity extraction types
 */

export const ENTITY_TYPES = [
  'PERSON',
  'ORGANIZATION',
  'LOCATION',
  'DATE',
  'TIME',
  'MONEY',
  'PERCENTAGE',
  'PRODUCT',
  'EVENT',
  'LANGUAGE',
  'NATIONALITY',
  'RELIGION',
  'TITLE',
  'PROFESSION',
  'ANIMAL',
  'PLANT',
  'DISEASE',
  'MEDICATION',
  'CHEMICAL',
  'MATERIAL',
  'COLOR',
  'SHAPE',
  'MEASUREMENT',
  'WEATHER',
  'NATURAL_DISASTER',
  'AWARD',
  'LAW',
  'CRIME',
  'TECHNOLOGY',
  'SOFTWARE',
  'HARDWARE',
  'VEHICLE',
  'FOOD',
  'DRINK',
  'SPORT',
  'MUSIC_GENRE',
  'INSTRUMENT',
  'ARTWORK',
  'BOOK',
  'MOVIE',
  'TV_SHOW',
  'ACADEMIC_SUBJECT',
  'SCIENTIFIC_THEORY',
  'POLITICAL_PARTY',
  'CURRENCY',
  'STOCK_SYMBOL',
  'FILE_TYPE',
  'PROGRAMMING_LANGUAGE',
  'MEDICAL_PROCEDURE',
  'CELESTIAL_BODY',
  // Grand Débat specific types
  'COMMUNE',
  'CONCEPT',
  'COMMUNITY',
  'CIVIC_ENTITY',
  'THEME',
  'ACTOR',
  'PROPOSAL',
] as const

export type EntityType = (typeof ENTITY_TYPES)[number]

/**
 * Color palette for entity types - carefully selected to be visually distinct
 * Uses a mix of hues to maximize visual differentiation
 */
export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  // People & Roles
  'PERSON': '#ff4757',           // Red
  'PROFESSION': '#ff6348',       // Orange-red
  'NATIONALITY': '#ff7675',      // Light red

  // Organizations & Groups
  'ORGANIZATION': '#ffa502',     // Orange
  'POLITICAL_PARTY': '#ff9800',  // Deep orange
  'TITLE': '#ffb74d',            // Light orange

  // Places
  'LOCATION': '#00d2d3',         // Cyan
  'COMMUNE': '#00bcd4',          // Teal (Grand Débat)

  // Temporal
  'DATE': '#673ab7',             // Deep purple
  'TIME': '#7c4dff',             // Purple
  'WEATHER': '#9575cd',          // Light purple

  // Financial
  'MONEY': '#4caf50',            // Green
  'PERCENTAGE': '#66bb6a',       // Light green
  'CURRENCY': '#81c784',         // Lighter green
  'STOCK_SYMBOL': '#7cb342',     // Lime

  // Products & Materials
  'PRODUCT': '#2196f3',          // Blue
  'MATERIAL': '#42a5f5',         // Light blue
  'CHEMICAL': '#1e88e5',         // Deep blue
  'HARDWARE': '#1976d2',         // Darker blue
  'VEHICLE': '#1565c0',          // Navy

  // Technology
  'TECHNOLOGY': '#00bcd4',       // Cyan
  'SOFTWARE': '#0097a7',         // Dark cyan
  'PROGRAMMING_LANGUAGE': '#00838f', // Darker cyan
  'FILE_TYPE': '#26c6da',        // Light cyan

  // Health & Science
  'DISEASE': '#e91e63',          // Pink
  'MEDICATION': '#ec407a',       // Light pink
  'MEDICAL_PROCEDURE': '#f06292', // Lighter pink
  'SCIENTIFIC_THEORY': '#ab47bc', // Purple

  // Animals & Plants
  'ANIMAL': '#8d6e63',           // Brown
  'PLANT': '#66bb6a',            // Green
  'FOOD': '#ffca28',             // Yellow
  'DRINK': '#fdd835',            // Light yellow

  // Arts & Media
  'ARTWORK': '#ff69b4',          // Hot pink
  'BOOK': '#ffd700',             // Gold (Grand Débat)
  'MOVIE': '#ffb300',            // Amber
  'TV_SHOW': '#ff6f00',          // Deep orange
  'MUSIC_GENRE': '#d32f2f',      // Dark red
  'INSTRUMENT': '#c2185b',       // Crimson

  // Visual Properties
  'COLOR': '#c2185b',            // Crimson
  'SHAPE': '#90caf9',            // Light blue

  // Events & Activities
  'EVENT': '#ff5722',            // Deep orange
  'SPORT': '#d32f2f',            // Dark red
  'AWARD': '#ffd700',            // Gold

  // Law & Society
  'LAW': '#1a237e',              // Dark blue
  'CRIME': '#b71c1c',            // Dark red

  // Academic
  'ACADEMIC_SUBJECT': '#512da8',     // Deep purple
  'LANGUAGE': '#7e57c2',             // Purple
  'RELIGION': '#9575cd',             // Light purple

  // Natural
  'NATURAL_DISASTER': '#d32f2f',  // Dark red
  'CELESTIAL_BODY': '#ffd54f',    // Light gold
  'MEASUREMENT': '#64b5f6',       // Blue

  // Grand Débat specific
  'CONCEPT': '#7bed9f',           // Green (from existing legend)
  'COMMUNITY': '#ff69b4',         // Pink
  'CIVIC_ENTITY': '#a0a0a0',      // Gray (fallback)
  'THEME': '#7bed9f',             // Green
  'ACTOR': '#ff4757',             // Red
  'PROPOSAL': '#2196f3',          // Blue
}

/**
 * Get color for entity type (with fallback)
 */
export function getEntityTypeColor(entityType: string | undefined): string {
  if (!entityType) return ENTITY_TYPE_COLORS['CIVIC_ENTITY']

  const normalized = entityType.toUpperCase() as EntityType
  return ENTITY_TYPE_COLORS[normalized] || ENTITY_TYPE_COLORS['CIVIC_ENTITY']
}

/**
 * Get display label for entity type (French)
 */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  'PERSON': 'Personne',
  'ORGANIZATION': 'Organisation',
  'LOCATION': 'Lieu',
  'DATE': 'Date',
  'TIME': 'Heure',
  'MONEY': 'Argent',
  'PERCENTAGE': 'Pourcentage',
  'PRODUCT': 'Produit',
  'EVENT': 'Événement',
  'LANGUAGE': 'Langue',
  'NATIONALITY': 'Nationalité',
  'RELIGION': 'Religion',
  'TITLE': 'Titre',
  'PROFESSION': 'Profession',
  'ANIMAL': 'Animal',
  'PLANT': 'Plante',
  'DISEASE': 'Maladie',
  'MEDICATION': 'Médicament',
  'CHEMICAL': 'Produit chimique',
  'MATERIAL': 'Matériel',
  'COLOR': 'Couleur',
  'SHAPE': 'Forme',
  'MEASUREMENT': 'Mesure',
  'WEATHER': 'Météo',
  'NATURAL_DISASTER': 'Catastrophe naturelle',
  'AWARD': 'Récompense',
  'LAW': 'Loi',
  'CRIME': 'Crime',
  'TECHNOLOGY': 'Technologie',
  'SOFTWARE': 'Logiciel',
  'HARDWARE': 'Matériel',
  'VEHICLE': 'Véhicule',
  'FOOD': 'Aliment',
  'DRINK': 'Boisson',
  'SPORT': 'Sport',
  'MUSIC_GENRE': 'Genre musical',
  'INSTRUMENT': 'Instrument',
  'ARTWORK': 'Œuvre d\'art',
  'BOOK': 'Livre',
  'MOVIE': 'Film',
  'TV_SHOW': 'Série TV',
  'ACADEMIC_SUBJECT': 'Sujet académique',
  'SCIENTIFIC_THEORY': 'Théorie scientifique',
  'POLITICAL_PARTY': 'Parti politique',
  'CURRENCY': 'Devise',
  'STOCK_SYMBOL': 'Symbole boursier',
  'FILE_TYPE': 'Type de fichier',
  'PROGRAMMING_LANGUAGE': 'Langage de programmation',
  'MEDICAL_PROCEDURE': 'Procédure médicale',
  'CELESTIAL_BODY': 'Corps céleste',
  'COMMUNE': 'Commune',
  'CONCEPT': 'Concept',
  'COMMUNITY': 'Communauté',
  'CIVIC_ENTITY': 'Entité civique',
  'THEME': 'Thème',
  'ACTOR': 'Acteur',
  'PROPOSAL': 'Proposition',
}

export function getEntityTypeLabel(entityType: string | undefined): string {
  if (!entityType) return 'Entité'

  const normalized = entityType.toUpperCase() as EntityType
  return ENTITY_TYPE_LABELS[normalized] || entityType
}
