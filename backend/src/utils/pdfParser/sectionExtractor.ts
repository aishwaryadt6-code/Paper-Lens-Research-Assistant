interface SectionHeader {
  title: string;
  index: number;
  length: number;
}

/**
 * Heuristic validation of section contents.
 */
function isValidSectionContent(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (/^[IVX\d\s.,:-]+$/.test(trimmed)) return false; // Contains only numbers/markers
  if (trimmed.split(/\s+/).length < 5) return false;  // Too few words
  return true;
}

export function findDynamicHeaders(text: string, documentType: string): SectionHeader[] {
  const headers: SectionHeader[] = [];
  
  // Heuristic patterns for headers
  const patterns = [
    // 1. Chapter headers for books (e.g. "Chapter 1: Intro", "CHAPTER II", etc.)
    /(?:^|\n)\s*(Chapter\s+\d+|CHAPTER\s+[IVX\d]+|Chapter\s+[a-zA-Z]+)(?:\s*[:-]?\s*([A-Z][A-Za-z0-9\s,-]{2,60}?))?(?:\s*[:-]?\s*(?:\n|$))/gi,
    
    // 2. Roman headers (e.g. "I. INTRODUCTION", "VII. REFERENCES")
    /(?:^|\n)\s*([IVXLCDM]+)\.\s+([A-Z][A-Za-z0-9\s,-]{2,60}?)(?:\s*[:-]?\s*(?:\n|$))/g,
    
    // 3. IEEE headers (e.g. "I INTRODUCTION" - no dot)
    /(?:^|\n)\s*([IVXLCDM]+)\s+([A-Z][A-Za-z0-9\s,-]{2,60}?)(?:\s*[:-]?\s*(?:\n|$))/g,
    
    // 4. Numeric headers (e.g. "1. Introduction", "2.1 Supervised Learning")
    /(?:^|\n)\s*(\d+(?:\.\d+)*)\.?\s+([A-Z][A-Za-z0-9\s,-]{2,60}?)(?:\s*[:-]?\s*(?:\n|$))/g,
    
    // 5. Standard plain headers (e.g. "Introduction", "References" at line start)
    /(?:^|\n)\s*(Introduction|Conclusion|Conclusions|References|Bibliography|Abstract|Summary|Keywords|Index|Appendix|Preface|Foreword)\b(?:\s*[:-]?\s*(?:\n|$))/gi
  ];

  patterns.forEach((pattern) => {
    let match;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const leadingNewlineOffset = fullMatch.startsWith('\n') ? 1 : 0;
      const index = match.index + leadingNewlineOffset;
      
      let title = '';
      if (fullMatch.toLowerCase().includes('chapter')) {
        const chapLabel = match[1].trim();
        const chapTitle = match[2] ? match[2].trim() : '';
        title = chapTitle ? `${chapLabel}: ${chapTitle}` : chapLabel;
      } else {
        // Keep full matched heading text including prefix
        title = fullMatch.trim().replace(/^[:.-]?\s*/, '').replace(/[:.-]?\s*$/, '');
      }

      // Skip in-text citation false positives
      const beforeIndex = Math.max(0, index - 25);
      const precedingText = text.substring(beforeIndex, index);
      if (/\b(?:section|fig|figure|table|in|see|ref|and|or)\b/i.test(precedingText)) {
        continue;
      }

      if (title.length > 2 && title.split(/\s+/).length < 10) {
        headers.push({
          title,
          index,
          length: fullMatch.length - leadingNewlineOffset
        });
      }
    }
  });

  // Sort by occurrence index
  headers.sort((a, b) => a.index - b.index);

  // Filter overlapping header matches
  const filtered: SectionHeader[] = [];
  headers.forEach((h) => {
    const overlaps = filtered.some(f => 
      (h.index >= f.index && h.index < f.index + f.length) ||
      (f.index >= h.index && f.index < h.index + h.length)
    );
    if (!overlaps) {
      filtered.push(h);
    }
  });

  return filtered;
}

export function extractSections(cleanedText: string, documentType: string) {
  const headers = findDynamicHeaders(cleanedText, documentType);
  
  const sectionsList: { title: string; content: string }[] = [];
  
  // Compatibility fields
  let introduction = '';
  let methodology = '';
  let results = '';
  let conclusion = '';
  let references = '';

  headers.forEach((header, idx) => {
    const start = header.index + header.length;
    let end = cleanedText.length;
    
    if (idx + 1 < headers.length) {
      end = headers[idx + 1].index;
    }

    const content = cleanedText.substring(start, end).trim();
    
    // We only preserve sections that have valid content
    if (isValidSectionContent(content)) {
      sectionsList.push({
        title: header.title,
        content
      });

      // strict mapping using prefix-stripped titles for comparison
      const titleLower = header.title.toLowerCase();
      const cleanTitle = titleLower.replace(/^(?:[ivxlcdm]+|\d+(?:\.\d+)*)\.?\s+/i, '').trim();

      if (cleanTitle === 'introduction') {
        introduction = content;
      } else if (
        cleanTitle === 'methodology' ||
        cleanTitle === 'methods' ||
        cleanTitle === 'research methodology' ||
        cleanTitle === 'proposed method' ||
        cleanTitle === 'experimental setup' ||
        cleanTitle === 'materials and methods'
      ) {
        methodology = content;
      } else if (
        cleanTitle === 'results' ||
        cleanTitle === 'evaluation' ||
        cleanTitle === 'experiments' ||
        cleanTitle === 'experimental results' ||
        cleanTitle === 'results and discussion' ||
        cleanTitle === 'discussion'
      ) {
        results = content;
      } else if (
        cleanTitle === 'conclusion' ||
        cleanTitle === 'conclusions' ||
        cleanTitle === 'future work' ||
        cleanTitle === 'conclusion and future work'
      ) {
        conclusion = content;
      } else if (
        cleanTitle === 'references' ||
        cleanTitle === 'bibliography' ||
        cleanTitle === 'works cited'
      ) {
        references = content;
      }
    }
  });

  return {
    sectionsList,
    compatibility: {
      introduction,
      methodology,
      results,
      conclusion,
      references
    }
  };
}
