/**
 * Extracts author names appearing directly below the title and above the abstract.
 * Discards affiliations, department names, universities, emails, or ISSN/DOI blocks.
 */
export function extractAuthors(cleanedText: string, title: string): string {
  if (!cleanedText) return 'Unknown / Not detected';

  // Find title position to start searching from
  let startPos = 0;
  if (title && title !== 'Unknown Title') {
    const idx = cleanedText.indexOf(title);
    if (idx !== -1) {
      startPos = idx + title.length;
    }
  }

  // Find abstract position to stop searching at
  let endPos = cleanedText.search(/\b(abstract|summary)\b/i);
  if (endPos === -1 || endPos < startPos) {
    endPos = startPos + 1500; // fallback scanning limit
  }

  const authorBlock = cleanedText.substring(startPos, endPos).trim();
  if (!authorBlock) return 'Unknown / Not detected';

  const lines = authorBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const authorNames: string[] = [];

  // Title words to check for duplication
  const titleWords = title ? title.toLowerCase().split(/\s+/).filter(w => w.length > 3) : [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    // 1. Skip lines that contain parts of the title to avoid title duplication in authors
    if (title && lower.includes(title.toLowerCase())) {
      continue;
    }
    // If a line consists entirely of words in the title, skip it
    const lineWords = lower.split(/\s+/).filter(w => w.length > 3);
    if (lineWords.length > 0 && lineWords.every(word => titleWords.includes(word))) {
      continue;
    }

    // 2. Skip affiliations, departments, universities, schools, labs
    if (
      lower.includes('university') ||
      lower.includes('universit') ||
      lower.includes('department') ||
      lower.includes('dept.') ||
      lower.includes('college') ||
      lower.includes('institute') ||
      lower.includes('academy') ||
      lower.includes('school of') ||
      lower.includes('labs') ||
      lower.includes('laboratory') ||
      lower.includes('center for') ||
      lower.includes('centre for') ||
      lower.includes('corporation') ||
      lower.includes('inc.') ||
      lower.includes('ltd.') ||
      lower.includes('group') ||
      lower.includes('technology') ||
      lower.includes('science') ||
      lower.includes('engineering') ||
      lower.includes('mathematics') ||
      lower.includes('physics') ||
      lower.includes('chemistry')
    ) {
      continue;
    }

    // 3. Skip addresses & location info
    if (
      lower.includes('india') ||
      lower.includes('usa') ||
      lower.includes('china') ||
      lower.includes('uk') ||
      lower.includes('germany') ||
      lower.includes('france') ||
      lower.includes('japan') ||
      lower.includes('korea') ||
      lower.includes('road') ||
      lower.includes('street') ||
      lower.includes('avenue') ||
      lower.includes('campus') ||
      /\b[a-z]{2}\b\s+\d{5}/i.test(line) // US State + Zip
    ) {
      continue;
    }

    // 4. Skip email addresses and ORCID/ISSN/DOI lines
    if (
      lower.includes('@') ||
      lower.includes('email') ||
      lower.includes('orcid') ||
      lower.includes('issn') ||
      lower.includes('doi') ||
      /orcid\.org/i.test(line) ||
      /^[0-9x-]{16,19}$/i.test(line)
    ) {
      continue;
    }

    // 5. Skip section headers or other paper noise
    if (
      lower.startsWith('abstract') ||
      lower.startsWith('summary') ||
      lower.startsWith('keywords') ||
      lower.startsWith('index terms') ||
      lower.startsWith('introduction') ||
      lower.startsWith('1. ') ||
      lower.startsWith('i. ')
    ) {
      continue;
    }

    // 6. Clean leading/trailing superscript numbers, footnote indices (e.g. "1,2", "*", "a,b")
    let cleanedLine = line
      .replace(/^[\d,*\s†‡§]+/, '') // leading markers
      .replace(/[\d,*\s†‡§]+$/, '') // trailing markers
      .trim();

    // Clean up commas or semicolons at the end of line
    cleanedLine = cleanedLine.replace(/[,;]+$/, '').trim();

    if (cleanedLine.length > 2) {
      // Validate that this line contains capitalized words (suggesting names)
      const capWords = cleanedLine.split(/\s+/).filter(w => /^[A-Z]/.test(w)).length;
      const totalWords = cleanedLine.split(/\s+/).length;
      
      // If at least 40% of the words are capitalized, treat it as names
      if (capWords / totalWords >= 0.4) {
        // Split names if separated by comma or 'and'
        const parts = cleanedLine.split(/\s*,\s*|\s+\band\b\s+/);
        for (const part of parts) {
          const trimmedPart = part.trim().replace(/\s+/g, ' ');
          if (trimmedPart.length > 2) {
            authorNames.push(trimmedPart);
          }
        }
      }
    }
  }

  if (authorNames.length === 0) {
    return 'Unknown / Not detected';
  }

  // Join names with newline for clean list layout
  return authorNames.join('\n');
}
