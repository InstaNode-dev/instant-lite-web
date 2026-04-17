import { test, expect } from '@playwright/test';

test.describe('Landing Page — Structure & Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/instant\.dev/);
  });

  test('hero headline is visible and correct', async ({ page }) => {
    const h1 = page.locator('.hero h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Get a Postgres database');
    await expect(h1).toContainText('3 seconds');
  });

  test('hero subtitle is visible', async ({ page }) => {
    const subtitle = page.locator('.hero p');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText('One command');
  });

  test('curl prompt box is visible with correct command', async ({ page }) => {
    const promptCode = page.locator('#promptCode');
    await expect(promptCode).toBeVisible();
    await expect(promptCode).toContainText('curl');
    await expect(promptCode).toContainText('/db/new');
    await expect(promptCode).toContainText('jq');
  });

  test('copy button exists and is clickable', async ({ page }) => {
    const copyBtn = page.locator('#copyBtn');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveText('Copy');
  });

  test('"No account" hint text is present', async ({ page }) => {
    const hint = page.locator('.hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('No account');
    await expect(hint).toContainText('curl');
  });

  test('JSON output preview shows expected fields', async ({ page }) => {
    const output = page.locator('.output-block');
    await expect(output).toBeVisible();
    await expect(output).toContainText('"ok"');
    await expect(output).toContainText('"connection_url"');
    await expect(output).toContainText('"token"');
    await expect(output).toContainText('"tier"');
    await expect(output).toContainText('"limits"');
    await expect(output).toContainText('"note"');
  });
});

test.describe('Landing Page — Services Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('all 3 services are listed', async ({ page }) => {
    const services = page.locator('.svc');
    await expect(services).toHaveCount(3);
  });

  test('Postgres service card is correct', async ({ page }) => {
    const pg = page.locator('.svc').nth(0);
    await expect(pg.locator('h3')).toHaveText('Postgres');
    await expect(pg.locator('code')).toHaveText('POST /db/new');
    await expect(pg.locator('p')).toContainText('pgvector');
  });

  test('Redis service card is correct', async ({ page }) => {
    const redis = page.locator('.svc').nth(1);
    await expect(redis.locator('h3')).toHaveText('Redis');
    await expect(redis.locator('code')).toHaveText('POST /cache/new');
    await expect(redis.locator('p')).toContainText('ACL');
  });

  test('Webhooks service card is correct', async ({ page }) => {
    const wh = page.locator('.svc').nth(2);
    await expect(wh.locator('h3')).toHaveText('Webhooks');
    await expect(wh.locator('code')).toHaveText('POST /webhook/new');
  });
});

test.describe('Landing Page — How It Works', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('3 steps are shown', async ({ page }) => {
    const steps = page.locator('.step');
    await expect(steps).toHaveCount(3);
  });

  test('step 1 says "One POST"', async ({ page }) => {
    const step1 = page.locator('.step').nth(0);
    await expect(step1.locator('h4')).toHaveText('One POST');
    await expect(step1.locator('p')).toContainText('500ms');
  });

  test('step 2 says "Paste and run"', async ({ page }) => {
    const step2 = page.locator('.step').nth(1);
    await expect(step2.locator('h4')).toHaveText('Paste and run');
    await expect(step2.locator('p')).toContainText('postgres://');
  });

  test('step 3 says "Keep it"', async ({ page }) => {
    const step3 = page.locator('.step').nth(2);
    await expect(step3.locator('h4')).toHaveText('Keep it');
    await expect(step3.locator('p')).toContainText('24h');
  });
});

test.describe('Landing Page — AI Agents Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('agents section has heading', async ({ page }) => {
    await expect(page.locator('.agents h2')).toHaveText('Built for AI agents');
  });

  test('agent prompt text mentions instanode.dev and curl', async ({ page }) => {
    const prompt = page.locator('.prompt-inline');
    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText('instanode.dev');
    await expect(prompt).toContainText('curl');
  });

  test('llms.txt link exists', async ({ page }) => {
    const llmsLink = page.locator('.agent-links a', { hasText: 'llms.txt' });
    await expect(llmsLink).toBeVisible();
  });

  test('MCP Server link exists', async ({ page }) => {
    const mcpLink = page.locator('.agent-links a', { hasText: 'MCP Server' });
    await expect(mcpLink).toBeVisible();
    await expect(mcpLink).toHaveAttribute('href', /github/);
  });
});

test.describe('Landing Page — Pricing Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('2 pricing tiers are shown', async ({ page }) => {
    const tiers = page.locator('.tier');
    await expect(tiers).toHaveCount(2);
  });

  test('Free tier shows $0 and correct limits', async ({ page }) => {
    const free = page.locator('.tier').nth(0);
    await expect(free.locator('h3')).toHaveText('Free');
    await expect(free.locator('.price')).toHaveText('$0');
    await expect(free).toContainText('10MB');
    await expect(free).toContainText('5MB');
    await expect(free).toContainText('24 hours');
    await expect(free).toContainText('5 provisions');
  });

  test('Developer tier shows $12/mo and correct limits', async ({ page }) => {
    const dev = page.locator('.tier').nth(1);
    await expect(dev.locator('h3')).toHaveText('Developer');
    await expect(dev.locator('.price')).toHaveText('$12/mo');
    await expect(dev).toContainText('500MB');
    await expect(dev).toContainText('25MB');
    await expect(dev).toContainText('Never expires');
    await expect(dev).toContainText('14-day free trial');
  });
});

test.describe('Landing Page — Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('footer has llms.txt and status links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.locator('a', { hasText: 'llms.txt' })).toBeVisible();
    await expect(footer.locator('a', { hasText: 'Status' })).toBeVisible();
  });

  test('footer shows instanode.dev', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('instanode.dev');
  });
});

test.describe('Landing Page — API URL Configuration', () => {
  test('curl command uses configured API URL', async ({ page }) => {
    await page.goto('/');
    const promptCode = page.locator('#promptCode');
    const text = await promptCode.textContent();
    expect(text).toContain('/db/new');
    expect(text).toContain('curl');
  });

  test('status link in footer points to API healthz', async ({ page }) => {
    await page.goto('/');
    const statusLink = page.locator('footer a', { hasText: 'Status' });
    const href = await statusLink.getAttribute('href');
    expect(href).toContain('/healthz');
  });
});

test.describe('Landing Page — Visual Quality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page has dark background', async ({ page }) => {
    const bg = await page.locator('body').evaluate(el =>
      getComputedStyle(el).backgroundColor
    );
    expect(bg).toBe('rgb(10, 10, 10)');
  });

  test('hero text is white', async ({ page }) => {
    const color = await page.locator('.hero h1').evaluate(el =>
      getComputedStyle(el).color
    );
    expect(color).toBe('rgb(255, 255, 255)');
  });

  test('prompt box has distinct background', async ({ page }) => {
    const bg = await page.locator('.prompt').evaluate(el =>
      getComputedStyle(el).backgroundColor
    );
    expect(bg).toBe('rgb(17, 17, 17)');
  });

  test('copy button has border and is styled', async ({ page }) => {
    const border = await page.locator('#copyBtn').evaluate(el =>
      getComputedStyle(el).borderStyle
    );
    expect(border).toBe('solid');
  });

  test('page is scrollable and footer is at bottom', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });

  test('no horizontal scrollbar on desktop viewport', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});

test.describe('Landing Page — Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('page loads correctly on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('#promptCode')).toBeVisible();
  });

  test('services stack vertically on mobile', async ({ page }) => {
    await page.goto('/');
    const services = page.locator('.services');
    const gridCols = await services.evaluate(el =>
      getComputedStyle(el).gridTemplateColumns
    );
    // On mobile (375px), should be single column
    const colCount = gridCols.split(' ').length;
    expect(colCount).toBe(1);
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });
});

test.describe('Landing Page — llms.txt static file', () => {
  test('llms.txt is served at /llms.txt', async ({ page }) => {
    const response = await page.goto('/llms.txt');
    expect(response?.status()).toBe(200);
    const text = await page.content();
    expect(text).toContain('instanode.dev');
  });
});

test.describe('Landing Page — Screenshots', () => {
  test('desktop full page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: 'e2e/screenshots/desktop-full.png',
      fullPage: true,
    });
  });

  test('mobile full page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: 'e2e/screenshots/mobile-full.png',
      fullPage: true,
    });
  });

  test('section: hero + prompt', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.hero');
    await hero.screenshot({ path: 'e2e/screenshots/section-hero.png' });
    const prompt = page.locator('.prompt');
    await prompt.screenshot({ path: 'e2e/screenshots/section-prompt.png' });
  });

  test('section: JSON output preview', async ({ page }) => {
    await page.goto('/');
    const output = page.locator('.output');
    await output.screenshot({ path: 'e2e/screenshots/section-output.png' });
  });

  test('section: services row', async ({ page }) => {
    await page.goto('/');
    const services = page.locator('.services');
    await services.screenshot({ path: 'e2e/screenshots/section-services.png' });
  });

  test('section: how it works', async ({ page }) => {
    await page.goto('/');
    const how = page.locator('.how');
    await how.screenshot({ path: 'e2e/screenshots/section-how-it-works.png' });
  });

  test('section: AI agents', async ({ page }) => {
    await page.goto('/');
    const agents = page.locator('.agents');
    await agents.screenshot({ path: 'e2e/screenshots/section-agents.png' });
  });

  test('section: pricing', async ({ page }) => {
    await page.goto('/');
    const pricing = page.locator('.pricing');
    await pricing.screenshot({ path: 'e2e/screenshots/section-pricing.png' });
  });

  test('section: footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await footer.screenshot({ path: 'e2e/screenshots/section-footer.png' });
  });

  test('mobile: hero + prompt', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const hero = page.locator('.hero');
    await hero.screenshot({ path: 'e2e/screenshots/mobile-hero.png' });
    const prompt = page.locator('.prompt');
    await prompt.screenshot({ path: 'e2e/screenshots/mobile-prompt.png' });
  });

  test('mobile: services', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const services = page.locator('.services');
    await services.screenshot({ path: 'e2e/screenshots/mobile-services.png' });
  });

  test('mobile: pricing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const pricing = page.locator('.pricing');
    await pricing.screenshot({ path: 'e2e/screenshots/mobile-pricing.png' });
  });
});
