/**
 * Extracts the paper title from the cleaned text, ignoring metadata and headers.
 */
export function extractTitle(cleanedText: string, fallbackTitle: string): string {
  if (!cleanedText) return fallbackTitle;

  // Search in the first 1500 characters of the document
  const first1500 = cleanedText.slice(0, 1500);
  const lines = first1500.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const titleCandidates: string[] = [];
  let foundTitleStart = false;

  // Look at the first 15 non-empty lines
  const maxLinesToInspect = Math.min(lines.length, 15);

  for (let i = 0; i < maxLinesToInspect; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Check if we hit the abstract, keywords, or introduction - if so, stop title extraction
    if (
      lower.startsWith('abstract') ||
      lower.startsWith('summary') ||
      lower.startsWith('1. introduction') ||
      lower.startsWith('i. introduction') ||
      /^(1|i)\.?\s+introduction/i.test(lower)
    ) {
      break;
    }

    // Skip lines containing journal volume, issues, urls, DOIs, date notices, conference metadata, etc.
    if (
      lower.includes('arxiv:') ||
      lower.includes('journal of') ||
      lower.includes('proceedings of') ||
      lower.includes('volume') ||
      lower.includes('issue') ||
      lower.includes('http') ||
      lower.includes('vol.') ||
      lower.includes('issn') ||
      lower.includes('copyright') ||
      lower.includes('received') ||
      lower.includes('accepted') ||
      lower.includes('published') ||
      lower.includes('revised') ||
      lower.includes('available online') ||
      lower.includes('online library') ||
      lower.includes('conference') ||
      lower.includes('symposium') ||
      lower.includes('workshop') ||
      lower.includes('themed section') ||
      lower.includes('engineering and technology') ||
      /\bdoi\b/i.test(line) ||
      /\bissn\b/i.test(line) ||
      /^\d+$/.test(line)
    ) {
      continue;
    }

    // Skip uppercase-only paper identifier codes (e.g. "IJSRSET1962135 | ...")
    if (/^[A-Z0-9_\-|]+(?:\s*\|\s*[A-Z0-9_\-|]+)*$/.test(line) && line.length > 8) {
      continue;
    }
    // Also check for typical paper ID string lines containing pipes and spaces
    if (line.includes('|') && (lower.includes('received') || lower.includes('accepted') || lower.includes('published') || /^[A-Z0-9\s|]+$/i.test(line))) {
      continue;
    }

    // Skip affiliations, departments, universities, emails
    if (
      lower.includes('university') ||
      lower.includes('department') ||
      lower.includes('dept.') ||
      lower.includes('college') ||
      lower.includes('institute') ||
      lower.includes('academy') ||
      lower.includes('@') ||
      lower.includes('email') ||
      lower.includes('school of') ||
      lower.includes('labs') ||
      lower.includes('laboratory')
    ) {
      continue;
    }

    // Skip lines that look like email/ORCID or list of authors
    if (/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(line)) {
      continue;
    }

    // Detect author name list lines and stop title accumulation (e.g. John Doe, Jane Smith)
    const authorPattern = /^[A-Z][a-zA-Z.]+\s+[A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+)*\s*(?:,|\band\b)\s*[A-Z][a-zA-Z.]+\s+[A-Z][a-zA-Z.]+/;
    if (authorPattern.test(line)) {
      break;
    }

    // Stop title if line is lowercase or starts with "by" or "authors:"
    if (lower.startsWith('by ') || lower.startsWith('author')) {
      break;
    }

    // Title lines usually don't have citations [1]
    if (/\[\d+\]/.test(line)) {
      break;
    }

    // If we haven't found the title yet, this line starts our candidate
    if (!foundTitleStart) {
      titleCandidates.push(line);
      foundTitleStart = true;
    } else {
      // Continue title lines
      titleCandidates.push(line);
    }
  }

  const title = titleCandidates.join(' ').trim();
  
  // Return cleaned title or fallback
  return title.length > 8 ? title.replace(/\s+/g, ' ') : fallbackTitle;
}
