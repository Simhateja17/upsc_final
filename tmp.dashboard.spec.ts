import { test, expect } from '@playwright/test';

test('dashboard screenshot issues verification', async ({ page }) => {
  const email = `qa_${Date.now()}@example.com`;
  const password = 'Qatest@12345';

  await page.goto('http://localhost:3000/login?tab=signup', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const first = page.locator('input').nth(0);
  const last = page.locator('input').nth(1);
  const signupEmail = page.locator('input[type="email"]').first();
  const phone = page.locator('input').nth(3);
  const signupPass = page.locator('input[type="password"]').first();

  if (await first.count()) await first.fill('QA');
  if (await last.count()) await last.fill('Tester');
  if (await signupEmail.count()) await signupEmail.fill(email);
  if (await phone.count()) await phone.fill('9999999999');
  if (await signupPass.count()) await signupPass.fill(password);

  const terms = page.locator('input[type="checkbox"]').first();
  if (await terms.count()) await terms.check();

  const signupBtn = page.getByRole('button', { name: /Create Account|Sign Up|Register/i }).first();
  if (await signupBtn.count()) {
    await signupBtn.click();
    await page.waitForTimeout(2500);
  }

  await page.goto('http://localhost:3000/login?tab=login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const loginEmail = page.locator('input[type="email"]').first();
  const loginPass = page.locator('input[type="password"]').first();
  if (await loginEmail.count()) await loginEmail.fill(email);
  if (await loginPass.count()) await loginPass.fill(password);

  const loginBtn = page.getByRole('button', { name: /Login|Log In|Sign In/i }).first();
  if (await loginBtn.count()) await loginBtn.click();

  await page.waitForTimeout(5000);

  const onDashboard = page.url().includes('/dashboard');
  console.log('ON_DASHBOARD', onDashboard, page.url());

  await page.setViewportSize({ width: 1536, height: 2200 });
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'tmp_dashboard_auth_check.png', fullPage: true });

  const checklist: Record<string, boolean> = {};
  checklist['practice_test_button_present'] = (await page.getByText(/Practice Test/i).count()) > 0;
  checklist['schedule_button_present'] = (await page.getByText(/^Schedule$/i).count()) > 0;
  checklist['trio_status_available_label_removed'] = (await page.getByText(/Status:\s*available/i).count()) === 0;
  checklist['trio_pending_or_completed_visible'] = (await page.getByText(/Status:\s*(Pending|Completed|Unavailable)/i).count()) > 0;
  checklist['focus_timer_button_present'] = (await page.getByText(/Start Focus Session/i).count()) > 0;
  checklist['open_study_planner_link_present'] = (await page.getByText(/Open Study Planner/i).count()) > 0;
  checklist['quick_settings_present'] = (await page.getByText(/Quick Settings/i).count()) > 0;
  checklist['smart_revision_tools_present'] = (await page.getByText(/Smart Revision Tools/i).count()) > 0;
  checklist['upcoming_test_has_daily_mcq'] = (await page.getByText(/Daily MCQ/i).count()) > 0;
  checklist['upcoming_test_has_daily_mains'] = (await page.getByText(/Daily Mains/i).count()) > 0;

  console.log('CHECKLIST_JSON', JSON.stringify(checklist));
});
