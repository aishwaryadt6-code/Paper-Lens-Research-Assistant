import { IParserDiagnostics } from '../../types';

export function runDiagnostics(
  sections: {
    title: string;
    authors: string;
    abstract: string;
    keywords: string;
    introduction: string;
    methodology: string;
    results: string;
    conclusion: string;
    references: string;
    sectionsList: { title: string; content: string }[];
  },
  originalFileName: string,
  documentType: 'research_paper' | 'thesis' | 'book' | 'report' | 'unknown',
  hasTOC: boolean
): IParserDiagnostics {
  const detectedSections: string[] = [];
  const missingSections: string[] = [];
  const parserWarnings: string[] = [];

  // 1. Compile detected section titles
  sections.sectionsList.forEach(s => {
    detectedSections.push(s.title);
  });

  // Check expected section presence based on document type
  if (documentType === 'research_paper') {
    const checkSection = (name: string, content: string) => {
      if (!content || content.trim().length <= 20) {
        missingSections.push(name);
        parserWarnings.push(`Section "${name}" is missing or could not be reliably extracted.`);
      }
    };
    checkSection('Introduction', sections.introduction);
    checkSection('References', sections.references);
  }

  // 2. Calculate Confidence Score (0 to 100)
  let confidence = 0;

  if (documentType === 'book') {
    // Books: title, authors, chapter listings
    if (sections.title && sections.title !== originalFileName && sections.title !== 'Unknown Title') {
      confidence += 30;
    }
    if (sections.authors && sections.authors !== 'Unknown / Not detected') {
      confidence += 30;
    }
    if (sections.sectionsList.length > 0) {
      confidence += 40;
    }
  } else {
    // Research papers/other documents: title, authors, abstract, keywords, intro, references
    if (sections.title && sections.title !== originalFileName && sections.title !== 'Unknown Title') {
      confidence += 20;
    }
    if (sections.authors && sections.authors !== 'Unknown / Not detected') {
      confidence += 20;
    }
    if (sections.abstract && sections.abstract.length > 50) {
      confidence += 20;
    }
    if (sections.keywords) {
      confidence += 15;
    }
    if (sections.introduction) {
      confidence += 12.5;
    }
    if (sections.references) {
      confidence += 12.5;
    }
  }

  // Warnings for fallback cases
  if (!sections.title || sections.title === originalFileName || sections.title === 'Unknown Title') {
    parserWarnings.push('Title could not be extracted; using fallback file name.');
  }
  if (!sections.authors || sections.authors === 'Unknown / Not detected') {
    parserWarnings.push('Authors could not be detected.');
  }

  return {
    parserVersion: '2.2',
    documentType,
    detectedTitle: sections.title || '',
    detectedAuthors: sections.authors || '',
    detectedSections,
    missingSections,
    parserWarnings,
    extractionConfidence: Math.round(confidence),
    hasTableOfContents: hasTOC
  };
}
