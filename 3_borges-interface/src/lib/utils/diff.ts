/**
 * Text diff utility for answer comparison
 * Feature: 001-interactive-graphrag-refinement
 * Uses diff-match-patch library for word-level diffs
 */

import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

export interface DiffSegment {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

export interface AnswerDiff {
  segments: DiffSegment[];
  similarity: number; // 0.0 - 1.0
  changes_count: number;
  insertions_count: number;
  deletions_count: number;
}

/**
 * Compare two answers and generate word-level diff
 *
 * @param originalAnswer - Original answer text
 * @param newAnswer - New answer text after graph edits
 * @returns AnswerDiff with highlighted changes
 */
export function compareAnswers(
  originalAnswer: string,
  newAnswer: string
): AnswerDiff {
  // Generate diff using diff-match-patch
  const diffs = dmp.diff_main(originalAnswer, newAnswer);

  // Clean up semantically for better readability
  dmp.diff_cleanupSemantic(diffs);

  // Convert to our DiffSegment format
  const segments: DiffSegment[] = diffs.map(([operation, text]) => {
    let type: 'equal' | 'insert' | 'delete' = 'equal';
    if (operation === 1) type = 'insert';
    else if (operation === -1) type = 'delete';

    return { type, text };
  });

  // Calculate statistics
  const insertions_count = segments.filter(s => s.type === 'insert').length;
  const deletions_count = segments.filter(s => s.type === 'delete').length;
  const changes_count = insertions_count + deletions_count;

  // Calculate similarity using Levenshtein distance
  const levenshteinDistance = dmp.diff_levenshtein(diffs);
  const maxLength = Math.max(originalAnswer.length, newAnswer.length);
  const similarity = maxLength > 0
    ? 1 - (levenshteinDistance / maxLength)
    : 1.0;

  return {
    segments,
    similarity,
    changes_count,
    insertions_count,
    deletions_count
  };
}

/**
 * Render diff segments as HTML with color highlighting
 *
 * @param segments - Diff segments from compareAnswers
 * @returns HTML string with styled diff
 */
export function renderDiffHTML(segments: DiffSegment[]): string {
  return segments
    .map(segment => {
      if (segment.type === 'insert') {
        return `<span class="diff-insert">${escapeHTML(segment.text)}</span>`;
      } else if (segment.type === 'delete') {
        return `<span class="diff-delete">${escapeHTML(segment.text)}</span>`;
      } else {
        return escapeHTML(segment.text);
      }
    })
    .join('');
}

/**
 * Get plain text summary of changes
 *
 * @param diff - AnswerDiff result
 * @returns Human-readable summary
 */
export function getDiffSummary(diff: AnswerDiff): string {
  const { similarity, insertions_count, deletions_count } = diff;
  const percentSimilar = (similarity * 100).toFixed(1);

  if (similarity > 0.95) {
    return `Answers are nearly identical (${percentSimilar}% similar)`;
  } else if (similarity > 0.7) {
    return `Answers are similar (${percentSimilar}% similar) with ${insertions_count} additions and ${deletions_count} removals`;
  } else {
    return `Answers differ significantly (${percentSimilar}% similar) with ${insertions_count} additions and ${deletions_count} removals`;
  }
}

/**
 * Extract inserted text (new content in revised answer)
 *
 * @param segments - Diff segments
 * @returns Array of inserted text chunks
 */
export function getInsertedText(segments: DiffSegment[]): string[] {
  return segments
    .filter(s => s.type === 'insert')
    .map(s => s.text)
    .filter(text => text.trim().length > 0);
}

/**
 * Extract deleted text (removed content from original answer)
 *
 * @param segments - Diff segments
 * @returns Array of deleted text chunks
 */
export function getDeletedText(segments: DiffSegment[]): string[] {
  return segments
    .filter(s => s.type === 'delete')
    .map(s => s.text)
    .filter(text => text.trim().length > 0);
}

/**
 * Helper: Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format diff for side-by-side view
 *
 * @param originalAnswer - Original answer
 * @param newAnswer - New answer
 * @returns Object with original and new formatted text
 */
export function formatSideBySide(
  originalAnswer: string,
  newAnswer: string
): { original: string; new: string } {
  const diffs = dmp.diff_main(originalAnswer, newAnswer);
  dmp.diff_cleanupSemantic(diffs);

  let originalHTML = '';
  let newHTML = '';

  diffs.forEach(([operation, text]) => {
    const escaped = escapeHTML(text);

    if (operation === 0) {
      // Equal - show in both
      originalHTML += escaped;
      newHTML += escaped;
    } else if (operation === -1) {
      // Delete - show in original with strikethrough
      originalHTML += `<span class="diff-delete">${escaped}</span>`;
    } else if (operation === 1) {
      // Insert - show in new with highlight
      newHTML += `<span class="diff-insert">${escaped}</span>`;
    }
  });

  return {
    original: originalHTML,
    new: newHTML
  };
}
