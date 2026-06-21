/**
 * Extracts keyword values (Index Terms) for research papers, stopping immediately at introduction.
 */
export function extractKeywords(cleanedText: string, documentType: string): string {
  if (!cleanedText || documentType === 'book') return '';

  // Match keyword values up to introduction or a paragraph break
  const keywordRegex = /\b(?:keywords|index\s*terms)\b\s*[:.-—]?\s*([\s\S]*?)(?=\b(?:introduction|1\.?\s+introduction|i\.?\s+introduction)\b|\n\n)/i;
  const match = cleanedText.match(keywordRegex);

  if (match && match[1]) {
    let kw = match[1].trim();
    // Clean trailing period
    kw = kw.replace(/\.$/, '').trim();
    return kw;
  }

  // Fallback scan
  const index = cleanedText.search(/\b(?:keywords|index\s*terms)\b/i);
  if (index !== -1) {
    const start = index + cleanedText.match(/\b(?:keywords|index\s*terms)\b/i)![0].length;
    const sub = cleanedText.substring(start);
    const stopIndex = sub.search(/\b(introduction|1\.?\s+introduction|i\.?\s+introduction)\b/i);
    const newlineIndex = sub.indexOf('\n\n');
    
    let limit = 300;
    if (stopIndex !== -1 && stopIndex < limit) limit = stopIndex;
    if (newlineIndex !== -1 && newlineIndex < limit) limit = newlineIndex;
    
    let kw = sub.substring(0, limit).replace(/^[:.-—]?\s*/, '').trim();
    kw = kw.replace(/\.$/, '').trim();
    return kw;
  }

  return '';
}
