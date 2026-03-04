import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTitleFlasher } from '../../hooks/useTitleFlasher';

describe('useTitleFlasher', () => {
  const originalTitle = document.title;
  const messages = ['PRICES DROPPED!'];

  beforeEach(() => {
    document.title = 'Original Title';
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.title = originalTitle;
    vi.useRealTimers();
  });

  it('should not flash title when isActive is false', () => {
    renderHook(() => useTitleFlasher(false, messages));

    vi.advanceTimersByTime(2000);
    expect(document.title).toBe('Original Title');
  });

  it('should flash title when isActive is true', () => {
    renderHook(() => useTitleFlasher(true, messages));

    // First interval tick
    vi.advanceTimersByTime(1000);
    expect(document.title).toBe(messages[0]);

    // Second interval tick (should restore title)
    vi.advanceTimersByTime(1000);
    expect(document.title).toBe('Original Title');
  });

  it('should restore title when unmounted', () => {
    const { unmount } = renderHook(() => useTitleFlasher(true, messages));

    vi.advanceTimersByTime(1000);
    expect(document.title).toBe(messages[0]);

    unmount();
    expect(document.title).toBe('Original Title');
  });
});
