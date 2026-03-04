import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CollapsibleSection } from '../../components/CollapsibleSection';
import { Analytics } from '../../utils/analytics';

describe('CollapsibleSection', () => {
  it('should render and toggle expansion', () => {
    const title = 'Test Section';
    const content = 'Section Content';

    render(
      <CollapsibleSection title={title}>
        <div>{content}</div>
      </CollapsibleSection>,
    );

    expect(screen.getByText(title)).toBeDefined();
    expect(screen.getByText(content)).toBeDefined();

    const button = screen.getByRole('button');

    // Toggle to collapse
    fireEvent.click(button);
    expect(Analytics.trackSectionToggle).toHaveBeenCalledWith(title, false);

    // Toggle to expand
    fireEvent.click(button);
    expect(Analytics.trackSectionToggle).toHaveBeenCalledWith(title, true);
  });

  it('should respect defaultExpanded prop', () => {
    const title = 'Collapsed Section';
    render(
      <CollapsibleSection title={title} defaultExpanded={false}>
        <div>Content</div>
      </CollapsibleSection>,
    );

    const button = screen.getByRole('button');
    const svg = button.querySelector('div.rotate-180');
    expect(svg).toBeNull(); // Should not have rotate-180 class when collapsed
  });

  it('should persist state to localStorage when storageKey is provided', () => {
    const title = 'Persistent Section';
    const storageKey = 'test-section';

    const { rerender } = render(
      <CollapsibleSection title={title} storageKey={storageKey} defaultExpanded={true}>
        <div>Content</div>
      </CollapsibleSection>,
    );

    const button = screen.getByRole('button');

    // Collapse it
    fireEvent.click(button);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(vi.mocked(localStorage.setItem)).toHaveBeenCalledWith(`section_${storageKey}`, 'false');

    // Rerender - should be collapsed now because of localStorage
    rerender(
      <CollapsibleSection title={title} storageKey={storageKey} defaultExpanded={true}>
        <div>Content</div>
      </CollapsibleSection>,
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(vi.mocked(localStorage.getItem)).toHaveBeenCalledWith(`section_${storageKey}`);
  });
});
