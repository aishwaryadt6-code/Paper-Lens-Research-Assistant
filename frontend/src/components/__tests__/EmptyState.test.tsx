import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../../components/ui/EmptyState';
import { FileText } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={<FileText />}
        title="No papers yet"
        description="Upload a paper to get started"
      />
    );
    expect(screen.getByText('No papers yet')).toBeInTheDocument();
    expect(screen.getByText('Upload a paper to get started')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const handler = vi.fn();
    render(
      <EmptyState
        icon={<FileText />}
        title="Empty"
        description="Nothing here"
        action={{ label: 'Add item', onClick: handler }}
      />
    );
    expect(screen.getByText('Add item')).toBeInTheDocument();
  });

  it('calls action onClick', () => {
    const handler = vi.fn();
    render(
      <EmptyState
        icon={<FileText />}
        title="Empty"
        description="Nothing here"
        action={{ label: 'Add item', onClick: handler }}
      />
    );
    fireEvent.click(screen.getByText('Add item'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when not provided', () => {
    render(
      <EmptyState icon={<FileText />} title="Empty" description="Nothing here" />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
