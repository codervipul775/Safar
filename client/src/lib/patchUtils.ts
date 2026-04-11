import { applyPatch, parsePatch } from 'diff';
import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();

/**
 * Detects if a string contains SEARCH/REPLACE blocks (Aider-style).
 */
export function hasSearchReplaceBlocks(content: string): boolean {
  return content.includes('<<<<<<< SEARCH') && content.includes('=======') && content.includes('>>>>>>> REPLACE');
}

/**
 * Detects if a string contains a unified diff / patch.
 */
export function isUnifiedDiff(content: string): boolean {
  const lines = content.split('\n');
  const hasDiffHeader = lines.some(l => l.startsWith('--- ') || l.startsWith('+++ '));
  const hasHunkHeader = lines.some(l => l.startsWith('@@ -'));
  return hasDiffHeader && hasHunkHeader;
}

/**
 * Normalizes a line for fuzzy matching by removing all whitespace.
 */
function normalize(line: string): string {
  return line.trim().replace(/\s+/g, '');
}

/**
 * Applies Aider-style SEARCH/REPLACE blocks to content.
 */
export function applySearchReplace(currentContent: string, newContent: string): string | null {
  const blockRegex = /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g;
  let workingContent = currentContent;
  let match;
  let successCount = 0;

  while ((match = blockRegex.exec(newContent)) !== null) {
    const searchText = match[1];
    const replaceText = match[2];

    // Try exact match first
    if (workingContent.includes(searchText)) {
      workingContent = workingContent.replace(searchText, replaceText);
      successCount++;
    } else {
      // Fallback: search-and-replace often fails due to one missing newline or space
      // We'll try to find a "very close" match using DMP
      const expectedLoc = workingContent.indexOf(searchText.split('\n')[0]) || 0;
      const matchLoc = dmp.match_main(workingContent, searchText, expectedLoc);
      
      if (matchLoc !== -1) {
        const before = workingContent.slice(0, matchLoc);
        const after = workingContent.slice(matchLoc + searchText.length);
        workingContent = before + replaceText + after;
        successCount++;
      } else {
        console.warn('SearchReplace: Failed to find block:\n', searchText);
        return null;
      }
    }
  }

  return successCount > 0 ? workingContent : null;
}

/**
 * Attempts to apply a patch or edit blocks to current content.
 * ORDER OF OPERATIONS:
 * 1. Try SEARCH/REPLACE blocks (most robust).
 * 2. Try standard JSDiff (accurate formatting).
 * 3. Try Bitap Patching (backup fuzzy logic).
 */
export function smartApply(currentContent: string, newContent: string): string | null {
  // 1. SEARCH/REPLACE (Aider-style)
  if (hasSearchReplaceBlocks(newContent)) {
    const srResult = applySearchReplace(currentContent, newContent);
    if (srResult !== null) return srResult;
  }

  // 2. UNIFIED DIFF (Standard / AI Fallback)
  if (isUnifiedDiff(newContent)) {
    // Stage 2a: Standard JSDiff
    const diffStart = newContent.search(/^--- /m);
    if (diffStart !== -1) {
      const patchBlock = newContent.slice(diffStart);
      try {
        const jsResult = applyPatch(currentContent, patchBlock, {
          fuzzFactor: 3,
          compareLine(lineNumber, line, operation, patchContent) {
            return normalize(line) === normalize(patchContent);
          }
        });
        if (jsResult !== false) return jsResult;
      } catch (e) {}

      // Stage 2b: Bitap Hunk Matching
      try {
        const patches = parsePatch(patchBlock);
        let workingContent = currentContent;
        for (const patch of patches) {
          for (const hunk of patch.hunks) {
            const oldLines = hunk.lines.filter(l => l.startsWith(' ') || l.startsWith('-')).map(l => l.slice(1));
            const newLines = hunk.lines.filter(l => l.startsWith(' ') || l.startsWith('+')).map(l => l.slice(1));
            const oldText = oldLines.join('\n');
            const newText = newLines.join('\n');
            const matchLoc = dmp.match_main(workingContent, oldText, hunk.oldStart);
            if (matchLoc !== -1) {
              workingContent = workingContent.slice(0, matchLoc) + newText + workingContent.slice(matchLoc + oldText.length);
            } else return null;
          }
        }
        return workingContent;
      } catch (e) {}
    }
  }

  // 3. FULL REPLACEMENT (If neither format detected)
  // If it doesn't look like a diff or block but is non-empty, treat as full file
  if (newContent.trim().length > 0 && !isUnifiedDiff(newContent) && !hasSearchReplaceBlocks(newContent)) {
    return newContent;
  }

  return null;
}
