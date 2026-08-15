import { expect, test } from '@playwright/test';
import { EMPLOYEE, MANAGER, login } from './helpers';

test('rejects wrong credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-post').fill(MANAGER.email);
  await page.getByLabel('Lösenord').fill('fel-lösenord');
  await page.getByRole('button', { name: 'Logga in' }).click();
  await expect(page).toHaveURL(/login/);
  await expect(page.getByRole('link', { name: /Semester.?Planner/ })).toHaveCount(0);
});

test('manager sees the manager-only navigation', async ({ page }) => {
  await login(page, MANAGER);
  const nav = page.getByRole('navigation', { name: 'Huvudmeny' });
  await expect(nav.getByRole('link', { name: 'Översikt' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Rapporter' })).toBeVisible();
});

test('employee lacks manager navigation and is bounced from /dashboard', async ({ page }) => {
  await login(page, EMPLOYEE);
  const nav = page.getByRole('navigation', { name: 'Huvudmeny' });
  await expect(nav.getByRole('link', { name: 'Planering' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Översikt' })).toHaveCount(0);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/planning/);
});

test('unauthenticated visits are sent to /login', async ({ page }) => {
  await page.goto('/planning');
  await expect(page).toHaveURL(/login/);
});
