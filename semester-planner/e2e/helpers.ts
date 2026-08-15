import { expect, type Page } from '@playwright/test';

export const MANAGER = { email: 'manager@example.com', password: 'demo-password' };
export const EMPLOYEE = { email: 'anna.lindgren@example.com', password: 'demo-password' };

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('E-post').fill(user.email);
  await page.getByLabel('Lösenord').fill(user.password);
  await page.getByRole('button', { name: 'Logga in' }).click();
  await expect(page.getByRole('link', { name: /Semester.?Planner/ })).toBeVisible();
}
