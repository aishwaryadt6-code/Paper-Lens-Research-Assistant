import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../../components/ui/Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays hint when no error', () => {
    render(<Input hint="Must be a valid email" />);
    expect(screen.getByText('Must be a valid email')).toBeInTheDocument();
  });

  it('does not show hint when error is present', () => {
    render(<Input hint="hint text" error="error text" />);
    expect(screen.queryByText('hint text')).not.toBeInTheDocument();
    expect(screen.getByText('error text')).toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    const handler = vi.fn();
    render(<Input onChange={handler} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(handler).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
