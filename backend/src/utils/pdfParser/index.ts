import { cleanText, removeTOC, classifyDocument, skipFrontMatterForBook } from './textCleaner';
import { extractTitle } from './titleExtractor';
import { extractAuthors } from './authorExtractor';
import { extractAbstract } from './abstractExtractor';
import { extractKeywords } from './keywordExtractor';
import { extractSections } from './sectionExtractor';
import { extractReferences } from './referenceExtractor';
import { runDiagnostics } from './diagnostics';
import { IParserDiagnostics } from '../../types';

export interface ExtractedSections {
  title: string;
  authors: string;
  abstract: string;
  keywords: string;
  introduction: string;
  methodology: string;
  results: string;
  conclusion: string;
  references: string;
  sections?: { title: string; content: string }[];
}

export function parseAcademicPaper(
  text: string,
  fallbackTitle: string
): { sections: ExtractedSections; diagnostics: IParserDiagnostics } {
  // 1. Remove Table of Contents
  let { cleanedText, hasTOC } = removeTOC(text);

  // 2. Classify document type
  const docType = classifyDocument(cleanedText);

  // 3. Skip front matter if book
  if (docType === 'book') {
    cleanedText = skipFrontMatterForBook(cleanedText);
  }

  // 4. Clean header/footer/page details
  cleanedText = cleanText(cleanedText);

  // 5. Extract Title
  const title = extractTitle(cleanedText, fallbackTitle);

  // 6. Extract Authors
  const authors = extractAuthors(cleanedText, title);

  // 7. Extract Abstract (if not book)
  const abstract = extractAbstract(cleanedText, docType);

  // 8. Extract Keywords (if not book)
  const keywords = extractKeywords(cleanedText, docType);

  // 9. Extract dynamic sections list & compatibility fields
  const { sectionsList, compatibility } = extractSections(cleanedText, docType);

  // 10. Extract cleaned references
  const cleanedReferences = extractReferences(cleanedText, docType);

  const sections: ExtractedSections = {
    title,
    authors,
    abstract,
    keywords,
    introduction: compatibility.introduction,
    methodology: compatibility.methodology,
    results: compatibility.results,
    conclusion: compatibility.conclusion,
    references: cleanedReferences || compatibility.references,
    sections: sectionsList,
  };

  // Truncate fields for database sanity constraints
  const truncate = (s: string, len: number) => s.length > len ? s.substring(0, len) + '...' : s;
  sections.title = truncate(sections.title, 500);
  sections.authors = truncate(sections.authors, 500);
  sections.abstract = truncate(sections.abstract, 8000);
  sections.keywords = truncate(sections.keywords, 1000);
  sections.introduction = truncate(sections.introduction, 25000);
  sections.methodology = truncate(sections.methodology, 25000);
  sections.results = truncate(sections.results, 25000);
  sections.conclusion = truncate(sections.conclusion, 15000);
  sections.references = truncate(sections.references, 20000);

  // Truncate dynamic sections content
  if (sections.sections) {
    sections.sections = sections.sections.map(s => ({
      title: s.title,
      content: truncate(s.content, 25000)
    }));
  }

  // 11. Run diagnostics
  const diagnostics = runDiagnostics(
    { ...sections, sectionsList },
    fallbackTitle,
    docType,
    hasTOC
  );

  return { sections, diagnostics };
}
