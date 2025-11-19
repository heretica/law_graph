/**
 * TypeScript types for graph editing
 * Feature: 001-interactive-graphrag-refinement
 */

export type EditType =
  | 'entity_add'
  | 'entity_delete'
  | 'entity_modify'
  | 'relationship_add'
  | 'relationship_modify'
  | 'relationship_delete';

export type ValidationStatus = 'valid' | 'conflict' | 'rolled_back' | 'pending';

export interface GraphEdit {
  id: string;
  edit_type: EditType;
  target_id: string;
  old_value: string; // JSON string
  new_value: string; // JSON string
  justification: string;
  editor_id: string;
  timestamp: string; // ISO datetime
  applied: boolean;
  validation_status: ValidationStatus;
}

export interface RelationshipEditRequest {
  source_id: string;
  target_id: string;
  old_type: string;
  new_type: string;
  properties?: Record<string, any>;
  justification: string;
  editor_id: string;
}

export interface AddRelationshipRequest {
  source_id: string;
  target_id: string;
  relationship_type: string;
  description?: string;
  properties?: Record<string, any>;
  bidirectional?: boolean;
  justification: string;
  editor_id: string;
}

export interface EditEntityRequest {
  entity_id: string;
  old_properties: Record<string, any>;
  new_properties: Record<string, any>;
  justification: string;
  editor_id: string;
}

export interface ValidationResult {
  valid: boolean;
  level: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  impact: {
    affected_entities?: number;
    affected_relationships?: number;
    orphan_risk?: boolean;
  };
}

export interface EditResponse {
  success: boolean;
  edit_id?: string;
  validation: ValidationResult;
  message: string;
}

export interface EditError {
  code: string;
  message: string;
  details?: any;
}

export interface EditHistoryItem {
  edit: GraphEdit;
  summary: string; // Human-readable summary
  can_rollback: boolean;
}

export interface EditConflict {
  conflicting_edit_id: string;
  conflict_type: 'concurrent_modification' | 'dependency_violation' | 'state_mismatch';
  resolution_options: string[];
}

/**
 * Constitutional Principle #1: No orphan nodes allowed
 * Validation ensures edits don't create isolated entities
 */
