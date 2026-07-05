import { expect, test, type Page } from '@playwright/test';
import { EMPLOYEE, MANAGER, login } from './helpers';

/**
 * The suite runs against a seeded database (fresh in CI). The submitted week is
 * picked from a candidate list because reruns against the same local database
 * leave approved blocks behind that would overlap.
 */
const NOTE = `e2e-${Date.now()}`;

async function submitFirstFreeWeek(page: Page): Promise<boolean> {
  for (const week of [45, 47, 49, 50, 51]) {
    await page.getByLabel('Från vecka').fill(String(week));
    await page.getByLabel('Till vecka').fill(String(week));
    await page.getByLabel('Kommentar (valfri)').fill(NOTE);
    await page.getByRole('button', { name: 'Skicka ansökan' }).click();
    // success ⇒ the note appears on a request card; failure ⇒ an alert shows
    const card = page.getByText(`”${NOTE}”`);
    try {
      await expect(card).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      // conflict for this week — try the next candidate
    }
  }
  return false;
}

test('employee submits a request and the manager approves it', async ({ page, browser }) => {
  await login(page, EMPLOYEE);
  await page.goto('/requests');
  expect(await submitFirstFreeWeek(page)).toBe(true);

  // Manager decides in a separate session.
  const managerContext = await browser.newContext();
  const managerPage = await managerContext.newPage();
  await login(managerPage, MANAGER);
  await managerPage.goto('/requests');

  const card = managerPage.locator('div', { hasText: `”${NOTE}”` }).last();
  await expect(card.getByRole('button', { name: 'Godkänn' })).toBeVisible();
  await card.getByLabel(/Kommentar till beslut/).fill('OK från e2e');
  await card.getByRole('button', { name: 'Godkänn' }).click();
  await expect(
    managerPage.locator('section[aria-label="Historik"]').getByText(`”${NOTE}”`).first(),
  ).toBeVisible({ timeout: 10_000 });
  await managerContext.close();

  // Employee sees the decision in their history + a notification.
  await page.goto('/requests');
  await expect(page.locator('section[aria-label="Historik"]').getByText(`”${NOTE}”`).first()).toBeVisible();
});
