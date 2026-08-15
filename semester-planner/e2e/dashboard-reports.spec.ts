import { expect, test } from '@playwright/test';
import { MANAGER, login } from './helpers';

test('dashboard shows tiles and risk table', async ({ page }) => {
  await login(page, MANAGER);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Översikt \d{4}/ })).toBeVisible();
  await expect(page.getByText('Väntande ansökningar')).toBeVisible();
  await expect(page.getByText('Största bemanningsriskerna (prognos)')).toBeVisible();
});

test('reports render the heatmap and CSV exports download', async ({ page }) => {
  await login(page, MANAGER);
  await page.goto('/reports');
  await expect(page.getByRole('heading', { name: /Rapporter \d{4}/ })).toBeVisible();
  await expect(page.getByText('Täckningskarta (prognos)')).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportera täckning (CSV)' }).click();
  expect((await download).suggestedFilename()).toMatch(/tackning-\d{4}\.csv/);

  const download2 = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportera frånvaro (CSV)' }).click();
  expect((await download2).suggestedFilename()).toMatch(/franvaro-\d{4}\.csv/);
});

test('planning board renders coverage rows', async ({ page }) => {
  await login(page, MANAGER);
  await page.goto('/planning');
  await expect(page.getByText('Avsyning').first()).toBeVisible();
  await expect(page.getByText('Serialisering').first()).toBeVisible();
});
