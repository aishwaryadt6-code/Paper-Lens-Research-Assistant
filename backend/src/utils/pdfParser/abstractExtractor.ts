/**
 * Extracts abstract content for research papers, and returns empty for books.
 */
export function extractAbstract(cleanedText: string, documentType: string): string {
  if (!cleanedText || documentType === 'book') return '';

  // Match the abstract/summary section up to keywords, index terms, or introduction
  const abstractRegex = /(?:^|\n)\s*(?:abstract|summary)\b\s*[:.-]?\s*([\s\S]*?)(?=\b(?:keywords|index\s*terms|introduction|1\.?\s+introduction|i\.?\s+introduction)\b)/i;
  const match = cleanedText.match(abstractRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback: simple text index slice
  const index = cleanedText.search(/\b(abstract|summary)\b/i);
  if (index !== -1) {
    const start = index + cleanedText.match(/\b(abstract|summary)\b/i)![0].length;
    const sub = cleanedText.substring(start);
    const stopIndex = sub.search(/\b(keywords|index\s*terms|introduction|1\.?\s+introduction|i\.?\s+introduction)\b/i);
    if (stopIndex !== -1) {
      return sub.substring(0, stopIndex).replace(/^[:.-]?\s*/, '').trim();
    }
    return sub.substring(0, 1500).replace(/^[:.-]?\s*/, '').trim();
  }

  return '';
}
