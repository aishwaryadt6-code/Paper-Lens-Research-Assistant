import { describe, it, expect } from 'vitest';
import { cn, formatBytes, getInitials, extractApiError } from '../../components/ui/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('filters falsy values', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });
});

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('formats fractional values', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });
});

describe('getInitials', () => {
  it('returns two-letter initials', () => {
    expect(getInitials('Jane Smith')).toBe('JS');
  });

  it('returns one letter for single name', () => {
    expect(getInitials('Alice')).toBe('AL');
  });

  it('handles multiple words', () => {
    expect(getInitials('Dr John Henry Smith')).toBe('DJ');
  });
});

describe('extractApiError', () => {
  it('extracts message from axios error', () => {
    const err = { response: { data: { message: 'Email already taken' } } };
    expect(extractApiError(err)).toBe('Email already taken');
  });

  it('extracts message from Error instance', () => {
    expect(extractApiError(new Error('Network error'))).toBe('Network error');
  });

  it('returns fallback for unknown errors', () => {
    expect(extractApiError(null)).toBe('An unexpected error occurred');
    expect(extractApiError('string error')).toBe('An unexpected error occurred');
  });
});
