import { expect, test } from '@playwright/test';

test('sanity check', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Bensa/i);
});
