import { expect, test } from '@playwright/test';
import { EMPLOYEE, MANAGER, login } from './helpers';

test('manager right-clicks a block for the action menu', async ({ page }) => {
  await login(page, MANAGER);
  await page.goto('/planning');

  const block = page.locator('div[role="button"][aria-label*="frånvaro"]').first();
  await block.click({ button: 'right' });

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByText('Sätt status')).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Redigera…' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Ta bort' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
});

test('manager right-clicks an empty cell to create', async ({ page }) => {
  await login(page, MANAGER);
  await page.goto('/planning');

  const cell = page.locator('button[aria-label^="Skapa frånvaro"]').first();
  await cell.click({ button: 'right' });

  await page.getByRole('menuitem', { name: 'Ny frånvaro här…' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Avbryt' }).click();
  await expect(dialog).toHaveCount(0);
});

test('employee gets no context menu', async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto('/planning');

  const block = page.locator('div[role="button"][aria-label*="frånvaro"]').first();
  await block.click({ button: 'right' });
  await expect(page.getByRole('menu')).toHaveCount(0);
});
