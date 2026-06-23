import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SimilarityPanel from '../SimilarityPanel';
import ContradictionPanel from '../ContradictionPanel';
import GraphPanel from '../GraphPanel';
import { aiService } from '../aiService';
import axios from 'axios';

// Mock axios for Similarity health check fallback
vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

const mockedAxios = axios as any;

// Mock reactflow
vi.mock('reactflow', () => {
  const ReactFlow = ({ children }: any) => <div data-testid="react-flow">{children}</div>;
  const Background = () => <div data-testid="rf-background" />;
  const Controls = () => <div data-testid="rf-controls" />;
  return {
    default: ReactFlow,
    Background,
    Controls,
    useNodesState: (initial: any) => {
      const [val, set] = useState(initial);
      return [val, set, vi.fn()];
    },
    useEdgesState: (initial: any) => {
      const [val, set] = useState(initial);
      return [val, set, vi.fn()];
    },
    MarkerType: {
      ArrowClosed: 'arrowclosed',
    },
    Handle: ({ type, position }: any) => <div data-testid={`handle-${type}-${position}`} />,
    Position: {
      Top: 'top',
      Bottom: 'bottom',
    },
  };
});

// Mock aiService
vi.mock('../aiService', () => {
  return {
    aiService: {
      similarity: vi.fn(),
      contradiction: vi.fn(),
      generateGraph: vi.fn(),
    },
    default: {
      similarity: vi.fn(),
      contradiction: vi.fn(),
      generateGraph: vi.fn(),
    },
  };
});

const mockedAiService = aiService as any;

const mockCurrentPaper = {
  _id: 'paper-1',
  title: 'Methodologies in AI Research',
  extractedMetadata: {
    abstract: 'This is the abstract for paper 1, discussing modern AI methodologies.',
    authors: 'John Doe, Jane Smith',
  },
  tags: ['AI', 'Methodology'],
};

const mockAllPapers = [
  mockCurrentPaper,
  {
    _id: 'paper-2',
    title: 'A Deep Dive into Neural Networks',
    extractedMetadata: {
      abstract: 'Abstract for neural networks research and applications.',
      authors: 'Alice Johnson',
    },
  },
  {
    _id: 'paper-3',
    title: 'NLP Contradiction Checking',
    extractedMetadata: {
      abstract: 'This paper contradicts the findings of paper 1.',
      authors: 'Bob Wilson',
    },
  },
];

describe('AI Insights Panels UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SimilarityPanel', () => {
    it('renders text areas and choice dropdowns', () => {
      render(<SimilarityPanel currentPaper={mockCurrentPaper} allPapers={mockAllPapers} />);
      
      expect(screen.getByText('Source Document (Active)')).toBeInTheDocument();
      expect(screen.getByText('Compare Against')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockCurrentPaper.extractedMetadata.abstract)).toBeInTheDocument();
      expect(screen.getByText('-- Choose Workspace Paper --')).toBeInTheDocument();
    });

    it('populates compare text area on dropdown choice selection', () => {
      render(<SimilarityPanel currentPaper={mockCurrentPaper} allPapers={mockAllPapers} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'paper-2' } });

      expect(screen.getByText('A Deep Dive into Neural Networks')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Abstract for neural networks research and applications.')).toBeInTheDocument();
    });

    it('calculates score and renders correct alignment ring on analyze click', async () => {
      mockedAiService.similarity.mockResolvedValueOnce(0.85);

      render(<SimilarityPanel currentPaper={mockCurrentPaper} allPapers={mockAllPapers} />);
      
      // Select paper 2
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'paper-2' } });

      const button = screen.getByRole('button', { name: /Compare Semantic Similarity/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockedAiService.similarity).toHaveBeenCalledWith(
          mockCurrentPaper.extractedMetadata.abstract,
          'Abstract for neural networks research and applications.'
        );
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('Strong Similarity')).toBeInTheDocument();
      });
    });

    it('shows offline warning banner if service returns 0 and healthcheck fails', async () => {
      mockedAiService.similarity.mockResolvedValueOnce(0);
      mockedAxios.get.mockRejectedValueOnce(new Error('Network offline'));

      render(<SimilarityPanel currentPaper={mockCurrentPaper} allPapers={mockAllPapers} />);
      
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'paper-2' } });
      fireEvent.click(screen.getByRole('button', { name: /Compare Semantic Similarity/i }));

      await waitFor(() => {
        expect(screen.getByText(/AI Service Offline/i)).toBeInTheDocument();
      });
    });
  });

  describe('ContradictionPanel', () => {
    it('renders side by side views and runs negation checks', async () => {
      mockedAiService.contradiction.mockResolvedValueOnce({
        contradiction_score: 0.88,
        confidence_score: 0.94,
        label: 'contradiction',
      });

      render(<ContradictionPanel currentPaper={mockCurrentPaper} allPapers={mockAllPapers} />);
      
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'paper-3' } });
      fireEvent.click(screen.getByRole('button', { name: /Detect Contradictory Claims/i }));

      await waitFor(() => {
        expect(mockedAiService.contradiction).toHaveBeenCalledWith(
          mockCurrentPaper.extractedMetadata.abstract,
          'This paper contradicts the findings of paper 1.'
        );
        expect(screen.getByText('88%')).toBeInTheDocument();
        expect(screen.getByText('High Contradiction Risk')).toBeInTheDocument();
        expect(screen.getByText('Inference Confidence: 94%')).toBeInTheDocument();
      });
    });

    it('displays compatible badge for low contradiction score', async () => {
      mockedAiService.contradiction.mockResolvedValueOnce({
        contradiction_score: 0.15,
        confidence_score: 0.88,
        label: 'neutral',
      });

      render(<ContradictionPanel currentPaper={mockCurrentPaper} allPapers={mockAllPapers} />);
      
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'paper-2' } });
      fireEvent.click(screen.getByRole('button', { name: /Detect Contradictory Claims/i }));

      await waitFor(() => {
        expect(screen.getByText('Compatible Findings')).toBeInTheDocument();
      });
    });
  });

  describe('GraphPanel', () => {
    it('renders loading initially, then displays nodes and reactflow', async () => {
      mockedAiService.generateGraph.mockResolvedValueOnce({
        nodes: [
          { id: 'paper-1', title: 'Paper 1' },
          { id: 'paper-2', title: 'Paper 2' },
        ],
        edges: [
          {
            sourcePaperId: 'paper-1',
            targetPaperId: 'paper-2',
            relationType: 'similarity',
            similarityScore: 0.85,
            contradictionScore: 0.1,
            confidenceScore: 0.9,
            reasoningSummary: 'Linked by concept',
          },
        ],
      });

      render(<GraphPanel currentPaper={mockCurrentPaper} allPapers={mockAllPapers} />);
      
      expect(screen.getByText(/Calculating relationships.../i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('shows offline connection recovery instructions when API is unreachable', async () => {
      mockedAiService.generateGraph.mockResolvedValueOnce({ nodes: [], edges: [] });

      render(<GraphPanel currentPaper={mockCurrentPaper} allPapers={mockAllPapers} />);

      await waitFor(() => {
        expect(screen.getByText('AI Relationship Service Offline')).toBeInTheDocument();
        expect(screen.getByText('python app/main.py --port 8000')).toBeInTheDocument();
      });
    });
  });
});
