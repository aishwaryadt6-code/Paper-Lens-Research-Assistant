/**
 * Extracts and cleans the references section.
 */
export function extractReferences(cleanedText: string, documentType: string): string {
  if (!cleanedText || documentType === 'book') return '';

  // Look for references section in the second half of the document
  const searchStartPos = Math.floor(cleanedText.length * 0.5);
  const subText = cleanedText.substring(searchStartPos);
  
  const refRegex = /(?:^|\n)\s*(?:references|bibliography|works\s+cited)\b\s*[:.-]?\s*\n?([\s\S]*)/i;
  const match = subText.match(refRegex);

  let rawRefs = '';
  if (match && match[1]) {
    rawRefs = match[1].trim();
  } else {
    const refPos = cleanedText.toLowerCase().lastIndexOf('references');
    if (refPos !== -1 && refPos > searchStartPos) {
      rawRefs = cleanedText.substring(refPos + 'references'.length).trim();
    }
  }

  if (!rawRefs) return '';

  const lines = rawRefs.split('\n');
  const cleanLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      cleanLines.push('');
      continue;
    }

    const lower = trimmed.toLowerCase();

    // 1. Scrub publisher, journal URLs, citation boilerplate, and author footer noise
    if (
      lower.includes('issn') ||
      lower.includes('doi') ||
      lower.includes('journal url') ||
      lower.includes('cite this article') ||
      lower.includes('ijsrset') ||
      lower.includes('int j sci res') ||
      lower.includes('themed section') ||
      lower.includes('engineering and technology') ||
      lower.includes('scientific research in') ||
      lower.includes('all rights reserved') ||
      lower.includes('copyright') ||
      lower.includes('authorized licensed use') ||
      lower.includes('akshat khaskalam') ||
      lower.includes('ruchi soni') ||
      lower.includes('www.') ||
      lower.startsWith('volume') ||
      lower.startsWith('issue') ||
      lower.startsWith('received') ||
      lower.startsWith('accepted')
    ) {
      continue;
    }

    // Skip pages and simple page numbers
    if (/^\d+$/.test(trimmed)) continue;
    if (/^page\s+\d+$/i.test(trimmed)) continue;
    if (/^\d+\s*of\s*\d+$/i.test(trimmed)) continue;

    // Skip lines that look like publisher metadata/ID codes
    if (/\b\d+-\d+-\d+-\d+-\d+.*©/i.test(trimmed) || /©\s*\d{4}\s*ieee/i.test(trimmed)) {
      continue;
    }
    if (/^\d+\s*\|\s*/.test(trimmed)) {
      continue;
    }

    cleanLines.push(trimmed);
  }

  const result = cleanLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return result;
}
