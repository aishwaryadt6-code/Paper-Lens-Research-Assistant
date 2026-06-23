import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WorkspaceGraphView from '../WorkspaceGraphView';
import axios from 'axios';

// Mock Axios
vi.mock('axios');
const mockedAxios = axios as vi.Mocked<typeof axios>;

// Mock React Flow to avoid canvas layout issues in jsdom
vi.mock('reactflow', () => {
  return {
    __esModule: true,
    default: ({ children, nodes, edges, onNodeClick }: any) => (
      <div data-testid="react-flow-mock">
        <div data-testid="nodes-count">{nodes?.length || 0}</div>
        <div data-testid="edges-count">{edges?.length || 0}</div>
        {nodes?.map((node: any) => (
          <button
            key={node.id}
            data-testid={`node-btn-${node.id}`}
            onClick={(e) => onNodeClick(e, node)}
          >
            {node.data.title}
          </button>
        ))}
        {children}
      </div>
    ),
    Background: () => <div data-testid="background-mock" />,
    Controls: () => <div data-testid="controls-mock" />,
    MiniMap: () => <div data-testid="minimap-mock" />,
    Handle: () => <div />,
    Position: { Top: 'top', Bottom: 'bottom' },
    MarkerType: { ArrowClosed: 'arrowclosed' },
  };
});

// Mock Auth Store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    token: 'mocked-jwt-token',
  }),
}));

// Mock Toast
vi.mock('../../components/ui/Toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('WorkspaceGraphView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/workspaces/ws123/graph']}>
        <Routes>
          <Route path="/workspaces/:id/graph" element={<WorkspaceGraphView />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading state initially', async () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves to keep loading state
    renderComponent();

    expect(screen.getByText(/Mapping academic knowledge network/i)).toBeInTheDocument();
  });

  it('renders graph with nodes and edges upon successful API response', async () => {
    // Mock workspace and graph responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/workspaces/')) {
        return Promise.resolve({ data: { data: { workspace: { name: 'ML Research Lab' } } } });
      }
      if (url.includes('/graph')) {
        return Promise.resolve({
          data: {
            data: {
              nodes: [
                { id: '1', title: 'Deep Learning Basics', authors: 'Author A', abstract: 'Deep learning abstract.' },
                { id: '2', title: 'CNN Architecture Optimization', authors: 'Author B', abstract: 'CNN abstract.' },
              ],
              edges: [
                {
                  id: 'edge1',
                  source: '1',
                  target: '2',
                  relationType: 'similarity',
                  similarityScore: 0.85,
                  contradictionScore: 0.1,
                  confidenceScore: 0.9,
                  reasoningSummary: 'Overlap in deep architectures.',
                },
              ],
            },
          },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderComponent();

    // Check workspace title is displayed
    await waitFor(() => {
      expect(screen.getByText('ML Research Lab')).toBeInTheDocument();
    });

    // Check custom react-flow mock received nodes/edges
    expect(screen.getByTestId('react-flow-mock')).toBeInTheDocument();
    expect(screen.getByTestId('nodes-count')).toHaveTextContent('2');
    expect(screen.getByTestId('edges-count')).toHaveTextContent('1');
  });

  it('renders ML fallback screen when the ML service / API is offline', async () => {
    // Mock network failure
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('ML Discovery Service Offline')).toBeInTheDocument();
    });
    expect(screen.getByText(/We couldn't connect to the machine learning microservice/i)).toBeInTheDocument();
  });

  it('allows filtering using the threshold slider and shows detail side panel on node click', async () => {
    // Mock workspace and graph data
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/workspaces/')) {
        return Promise.resolve({ data: { data: { workspace: { name: 'Data Mining Lab' } } } });
      }
      if (url.includes('/relations')) {
        return Promise.resolve({
          data: {
            data: {
              relations: [
                {
                  relationshipId: 'edge1',
                  paperId: '2',
                  title: 'CNN Architecture Optimization',
                  authors: 'Author B',
                  relationType: 'similarity',
                  similarityScore: 0.85,
                  contradictionScore: 0.1,
                  confidenceScore: 0.95,
                  reasoningSummary: 'Both papers analyze deep neural optimizations.',
                },
              ],
            },
          },
        });
      }
      if (url.includes('/graph')) {
        return Promise.resolve({
          data: {
            data: {
              nodes: [
                { id: '1', title: 'Deep Learning Basics', authors: 'Author A', abstract: 'Deep learning abstract.' },
                { id: '2', title: 'CNN Architecture Optimization', authors: 'Author B', abstract: 'CNN abstract.' },
              ],
              edges: [
                {
                  id: 'edge1',
                  source: '1',
                  target: '2',
                  relationType: 'similarity',
                  similarityScore: 0.85,
                  contradictionScore: 0.1,
                  confidenceScore: 0.9,
                  reasoningSummary: 'Overlap in deep architectures.',
                },
              ],
            },
          },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderComponent();

    // Wait for nodes to load
    await waitFor(() => {
      expect(screen.getByTestId('nodes-count')).toHaveTextContent('2');
    });

    // Verify Slider is present
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider).toBeInTheDocument();
    expect(slider.value).toBe('0.5');

    // Simulate changing slider threshold above edge weight (e.g. 0.95)
    fireEvent.change(slider, { target: { value: '0.95' } });
    expect(slider.value).toBe('0.95');

    // Edge count should drop to 0 because similarity 0.85 < threshold 0.95
    await waitFor(() => {
      expect(screen.getByTestId('edges-count')).toHaveTextContent('0');
    });

    // Reset slider back
    fireEvent.change(slider, { target: { value: '0.5' } });

    // Click a node to open details panel
    const nodeBtn = screen.getByTestId('node-btn-1');
    fireEvent.click(nodeBtn);

    // Sidebar should open
    await waitFor(() => {
      expect(screen.getByText('Paper Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Deep Learning Basics')).toBeInTheDocument();
      expect(screen.getByText('Deep learning abstract.')).toBeInTheDocument();
    });

    // Check relationship list
    expect(screen.getByText('Both papers analyze deep neural optimizations.')).toBeInTheDocument();
    expect(screen.getByText('0.85')).toBeInTheDocument();
  });
});
