import { useEffect } from 'react';

/**
 * Flashes the browser tab title to draw attention.
 * Used when price alerts fire.
 */
export function useTitleFlasher(isActive: boolean, messages: string[]): void {
  useEffect(() => {
    if (!isActive || messages.length === 0) return;

    const originalTitle = document.title;
    let index = 0;

    const interval = setInterval(() => {
      document.title = messages[index % messages.length];
      index++;
      if (index % 2 === 0) {
        document.title = originalTitle;
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      document.title = originalTitle;
    };
  }, [isActive, messages]);
}
