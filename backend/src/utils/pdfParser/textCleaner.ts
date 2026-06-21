/**
 * Classifies document types based on text indicators.
 */
export type DocumentType = 'research_paper' | 'thesis' | 'book' | 'report' | 'unknown';

export function classifyDocument(text: string): DocumentType {
  const lower = text.toLowerCase();
  
  let bookScore = 0;
  let paperScore = 0;
  
  // Book indicators
  if (lower.includes('table of contents') || lower.includes('contents\n') || lower.includes('contents \n')) bookScore += 3;
  if (lower.includes('chapter 1') || lower.includes('chapter i') || lower.includes('chapter one')) bookScore += 4;
  if (lower.includes('chapter 2') || lower.includes('chapter ii') || lower.includes('chapter two')) bookScore += 4;
  if (lower.includes('chapter 3') || lower.includes('chapter iii') || lower.includes('chapter three')) bookScore += 4;
  if (lower.includes('isbn')) bookScore += 3;
  if (lower.includes('preface')) bookScore += 2;
  if (lower.includes('foreword')) bookScore += 2;
  
  // Paper indicators
  if (lower.includes('abstract')) paperScore += 3;
  if (lower.includes('keywords') || lower.includes('index terms')) paperScore += 3;
  if (lower.includes('doi:') || lower.includes('doi.org')) paperScore += 2;
  
  if (bookScore > paperScore && bookScore >= 5) {
    return 'book';
  } else if (paperScore > bookScore && paperScore >= 4) {
    return 'research_paper';
  }
  
  return 'unknown';
}

/**
 * Detects Table of Contents pages in the document.
 */
export function detectTOCPages(pages: string[]): { tocIndices: number[]; hasTOC: boolean } {
  const tocIndices: number[] = [];
  
  pages.forEach((page, index) => {
    const lines = page.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let score = 0;
    
    // Explicit title
    if (page.match(/\b(table\s+of\s+contents|contents)\b/i)) {
      score += 5;
    }
    
    // Dotted leaders or consecutive listings
    let dottedLeaderCount = 0;
    let shortLinePageNumCount = 0;
    
    lines.forEach(line => {
      if (line.includes('....') || line.match(/\.{4,}\s*\d+/)) {
        dottedLeaderCount++;
      } else if (line.length < 80 && /\b(?:chapter|section|part|unit)?\s*\d+\b/i.test(line) && /\s+\d+$/i.test(line)) {
        shortLinePageNumCount++;
      }
    });
    
    if (dottedLeaderCount >= 3) score += 4;
    if (shortLinePageNumCount >= 4) score += 3;
    
    if (score >= 5 || (dottedLeaderCount >= 2 && shortLinePageNumCount >= 3)) {
      tocIndices.push(index);
    }
  });
  
  return { tocIndices, hasTOC: tocIndices.length > 0 };
}

/**
 * Removes TOC pages/sections from the text.
 */
export function removeTOC(text: string): { cleanedText: string; hasTOC: boolean } {
  let hasTOC = false;
  
  // Split by form feed first
  const pages = text.split(/\f/);
  if (pages.length > 1) {
    const { tocIndices, hasTOC: foundTOC } = detectTOCPages(pages);
    if (foundTOC) {
      hasTOC = true;
      const cleanPages = pages.filter((_, idx) => !tocIndices.includes(idx));
      return { cleanedText: cleanPages.join('\f'), hasTOC };
    }
  }
  
  // Fallback: block-level TOC removal
  const tocRegex = /\b(table\s+of\s+contents|contents)\b[\s\S]*?(?=\b(chapter\s+1|introduction|1\.\s+introduction|i\.\s+introduction)\b)/i;
  const match = text.match(tocRegex);
  if (match) {
    hasTOC = true;
    const cleanedText = text.replace(match[0], '');
    return { cleanedText, hasTOC };
  }
  
  return { cleanedText: text, hasTOC };
}

/**
 * Ignore front matter for books (TOC, copyright, preface, foreword, acknowledgements).
 */
export function skipFrontMatterForBook(text: string): string {
  // Look for Chapter 1 / CHAPTER I / Chapter One
  const chapterRegex = /(?:^|\n)\s*(?:chapter\s+(?:1|i|one)|1\.\s+[A-Z][a-zA-Z\s]+)\b/i;
  const match = text.match(chapterRegex);
  
  if (match && match.index !== undefined) {
    return text.substring(match.index).trim();
  }
  
  // Fallback: search for first actual narrative content (e.g. Introduction chapter)
  const introRegex = /(?:^|\n)\s*(?:1\.?\s+)?introduction\b/i;
  const matches = [...text.matchAll(new RegExp(introRegex, 'gi'))];
  if (matches.length > 0) {
    const firstMatch = matches[0];
    if (firstMatch.index !== undefined) {
      return text.substring(firstMatch.index).trim();
    }
  }
  
  return text;
}

export function cleanText(text: string): string {
  if (!text) return '';
  let cleaned = text;

  cleaned = cleaned.replace(/\r\n/g, '\n');

  // Filter out repeated header/footer blocks and metadata
  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;

    if (/^\d+$/.test(trimmed)) return false;
    if (/^page\s+\d+$/i.test(trimmed)) return false;
    if (/^\d+\s*of\s*\d+$/i.test(trimmed)) return false;

    const lower = trimmed.toLowerCase();
    
    if (lower.includes('issn:') || lower.includes('issn ') || lower.includes('e-issn')) return false;
    if (lower.includes('isbn:') || lower.includes('isbn ')) return false;
    if (lower.includes('doi:') || lower.includes('doi.org/') || lower.includes('https://doi.org')) return false;
    if (lower.includes('copyright ©') || lower.includes('copyright c ') || lower.startsWith('copyright')) return false;
    if (lower.includes('all rights reserved')) return false;
    
    if (lower.includes('proceedings of') || lower.includes('international journal of') || lower.includes('journal of')) return false;
    if (lower.includes('vol.') || lower.includes('volume') || lower.includes('issue') || lower.includes('pp.') || lower.includes('pages:')) {
      if (/(vol\.|volume)\s*\d+/i.test(trimmed) || /(no\.|issue)\s*\d+/i.test(trimmed)) {
        return false;
      }
    }
    
    if (/arxiv:\d+\.\d+/i.test(trimmed)) return false;

    return true;
  });

  cleaned = filteredLines.join('\n');
  cleaned = cleaned.replace(/(\b[a-zA-Z]{2,})-\n\s*([a-zA-Z]{2,}\b)/g, '$1$2');
  cleaned = cleaned.split('\n').map(line => line.replace(/[ \t]+/g, ' ')).join('\n');

  return cleaned.trim();
}
