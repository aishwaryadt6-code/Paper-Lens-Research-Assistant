import { parseAcademicPaper } from '../index';

const researchPaperText = `
Journal of Machine Learning Techniques, ISSN: 1234-5678, Vol. 8, No. 3
Received: 10 Jan 2026 / Accepted: 15 Mar 2026
DOI: 10.1109/JMLT.2026.001

A Survey on Machine Learning Techniques

Prof. Akshat Khaskalam
Ruchi Soni
Department of Computer Science, University of Technology
email: akshat@tech.edu

Abstract - This paper provides a comprehensive survey of modern machine learning techniques. We discuss supervised, unsupervised, and reinforcement learning methods.

Keywords: Machine learning, Supervised learning, Reinforcement Learning, Unsupervised learning, Outliers

I. INTRODUCTION
Machine learning has emerged as a key technology in modern computing. We introduce the core concepts.

II. SUPERVISED LEARNING
Supervised learning is where the model is trained on labeled data.

III. UNSUPERVISED LEARNING
Unsupervised learning operates on unlabeled datasets.

IV. REINFORCEMENT LEARNING
Reinforcement learning uses reward-based feedback loops.

V. OUTLIERS
Outlier detection is critical for data quality.

VI. CONCLUSION
We summarized various machine learning paradigms.

VII. REFERENCES
[1] J. Doe, "Machine Learning Basics", 2020.
[2] J. Smith, "Advanced ML Algorithms", 2021.
Journal Footer Block | Page 300 | Cite this article as: ...
`;

const bookText = `
Transformers for Natural Language Processing
Denis Rothman
ISBN: 978-1-80056-244-8

Table of Contents
Introduction ........ 25
Chapter 1 ........ 12
Chapter 2 ........ 100
Chapter 3 ........ 200
Index ........ 300

Preface
This is the preface of the book.

Transformers for Natural Language Processing
Denis Rothman

Chapter 1: Transformers Introduction
Transformers are state-of-the-art NLP models.

Chapter 2: BERT and GPT
BERT and GPT are famous transformer architectures.

Chapter 3: Fine-Tuning
Fine-tuning is the process of adjusting pre-trained weights.
`;

describe('Phase 2A.2 Parser Overhaul Suite', () => {
  test('Research Paper Parsing Verification', () => {
    const { sections, diagnostics } = parseAcademicPaper(researchPaperText, 'fallback.pdf');

    // Title Extraction
    expect(sections.title).toBe('A Survey on Machine Learning Techniques');

    // Author Extraction
    expect(sections.authors).toContain('Prof. Akshat Khaskalam');
    expect(sections.authors).toContain('Ruchi Soni');
    expect(sections.authors).not.toContain('Department of Computer Science');
    expect(sections.authors).not.toContain('email');

    // Abstract & Keywords Extraction
    expect(sections.abstract).toBe('This paper provides a comprehensive survey of modern machine learning techniques. We discuss supervised, unsupervised, and reinforcement learning methods.');
    expect(sections.keywords).toBe('Machine learning, Supervised learning, Reinforcement Learning, Unsupervised learning, Outliers');

    // Dynamic Section Verification
    expect(sections.sections).toBeDefined();
    expect(sections.sections!.length).toBe(6);
    expect(sections.sections![0].title).toBe('I. INTRODUCTION');
    expect(sections.sections![1].title).toBe('II. SUPERVISED LEARNING');
    expect(sections.sections![4].title).toBe('V. OUTLIERS');
    expect(sections.sections![5].title).toBe('VI. CONCLUSION');

    // References Verification
    expect(sections.references).toContain('[1] J. Doe');
    expect(sections.references).not.toContain('Journal Footer Block');
    expect(sections.references).not.toContain('Cite this article');

    // Diagnostics Verification
    expect(diagnostics.documentType).toBe('research_paper');
    expect(diagnostics.hasTableOfContents).toBe(false);
    expect(diagnostics.extractionConfidence).toBeGreaterThanOrEqual(80);
  });

  test('Book Parsing Verification', () => {
    const { sections, diagnostics } = parseAcademicPaper(bookText, 'transformers_book.pdf');

    // Classification
    expect(diagnostics.documentType).toBe('book');
    expect(diagnostics.hasTableOfContents).toBe(true);

    // Title & Authors
    expect(sections.title).toBe('Transformers for Natural Language Processing');
    expect(sections.authors).toBe('Denis Rothman');

    // Dynamic Chapters
    expect(sections.sections).toBeDefined();
    expect(sections.sections!.length).toBe(3);
    expect(sections.sections![0].title).toBe('Chapter 1: Transformers Introduction');
    expect(sections.sections![1].title).toBe('Chapter 2: BERT and GPT');

    // No Fake Research Structure
    expect(sections.abstract).toBe('');
    expect(sections.keywords).toBe('');
    expect(sections.introduction).toBe('');
    expect(sections.methodology).toBe('');
    expect(sections.results).toBe('');
    expect(sections.conclusion).toBe('');
  });
});
