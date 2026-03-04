import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '../../components/Skeleton';

describe('Skeleton', () => {
  it('should render with correct accessibility attributes', () => {
    render(<Skeleton />);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeDefined();
    expect(skeleton.getAttribute('aria-label')).toBe('grid.loading');
  });

  it('should apply custom className', () => {
    const customClass = 'w-10 h-10';
    render(<Skeleton className={customClass} />);

    const skeleton = screen.getByRole('status');
    expect(skeleton.className).toContain(customClass);
    expect(skeleton.className).toContain('animate-pulse');
  });
});
