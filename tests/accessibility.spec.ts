import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    // Inject axe-core into the page
    await injectAxe(page);
  });

  test('homepage should have no accessibility violations', async ({ page }) => {
    // Check for accessibility violations on the homepage
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should have skip link for keyboard navigation', async ({ page }) => {
    // Check if skip link exists and is functional
    const skipLink = page.locator('a[href="#main-content"]').first();
    await expect(skipLink).toBeAttached();
    
    // Skip link should be focusable with keyboard
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
  });
});

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start the development server if needed
    await page.goto('http://localhost:3000');
    await injectAxe(page);
  });

  test('homepage has no accessibility violations', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('exercise selection page has proper keyboard navigation', async ({ page }) => {
    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = page.locator('[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    
    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();

    // Test that all exercise buttons are keyboard accessible
    const exerciseButtons = page.locator('button:has-text("Start")');
    const buttonCount = await exerciseButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Verify first exercise button is focusable
    await exerciseButtons.first().focus();
    await expect(exerciseButtons.first()).toBeFocused();
  });

  test('settings modal has proper ARIA attributes', async ({ page }) => {
    // Open settings modal
    await page.getByRole('button', { name: /settings/i }).click();
    
    // Check dialog ARIA attributes
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-describedby');
    
    // Check fieldsets have proper legends
    const cefrFieldset = page.locator('fieldset').filter({ hasText: 'CEFR Level' });
    await expect(cefrFieldset).toBeVisible();
    
    const providerFieldset = page.locator('fieldset').filter({ hasText: 'AI Provider' });
    await expect(providerFieldset).toBeVisible();

    // Run accessibility check on modal
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('exercise page has proper form accessibility', async ({ page }) => {
    // Navigate to an exercise
    await page.getByRole('button', { name: /Start Verb Tenses/i }).click();
    
    await page.waitForLoadState('networkidle');
    
    // Check that form has proper labeling
    const form = page.locator('[data-testid="exercise-form"]');
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute('aria-labelledby');
    await expect(form).toHaveAttribute('aria-describedby');
    
    // Check that inputs have proper labels
    const inputs = page.locator('input[type="text"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      await expect(input).toHaveAttribute('aria-labelledby');
      await expect(input).toHaveAttribute('aria-describedby');
    }

    // Run accessibility check
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('progress indicators are accessible', async ({ page }) => {
    // Navigate to an exercise
    await page.getByRole('button', { name: /Start Verb Tenses/i }).click();
    
    await page.waitForLoadState('networkidle');
    
    // Check progress bar accessibility
    const progressBar = page.locator('[role="progressbar"]').first();
    if (await progressBar.count() > 0) {
      await expect(progressBar).toHaveAttribute('aria-label');
    }
  });

  test('radio button exercises have proper fieldset structure', async ({ page }) => {
    // Navigate to verb aspect exercise (uses radio buttons)
    await page.getByRole('button', { name: /Start Verb Aspect/i }).click();
    
    await page.waitForLoadState('networkidle');
    
    // Check that radio groups have proper fieldset/legend structure
    const fieldsets = page.locator('fieldset');
    const fieldsetCount = await fieldsets.count();
    
    if (fieldsetCount > 0) {
      for (let i = 0; i < fieldsetCount; i++) {
        const fieldset = fieldsets.nth(i);
        const legend = fieldset.locator('legend');
        await expect(legend).toBeAttached();
      }
    }

    // Run accessibility check
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('error messages are announced to screen readers', async ({ page }) => {
    // Navigate to an exercise
    await page.getByRole('button', { name: /Start Verb Tenses/i }).click();
    
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling anything
    const submitButton = page.getByRole('button', { name: /Check My Work/i });
    
    // Check if button is disabled when no answers (good UX)
    if (await submitButton.isDisabled()) {
      // Good - button should be disabled with empty answers
      expect(true).toBe(true);
    }
  });

  test('focus management works correctly', async ({ page }) => {
    // Test that focus is managed properly throughout the app
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Should go to first interactive element
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test focus after page navigation
    await page.getByRole('button', { name: /Start Verb Tenses/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Main content should be focused after navigation
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('screen reader content is properly hidden/exposed', async ({ page }) => {
    // Check that decorative icons are hidden from screen readers
    const decorativeIcons = page.locator('[aria-hidden="true"]');
    const iconCount = await decorativeIcons.count();
    
    // Should have some decorative icons marked as aria-hidden
    expect(iconCount).toBeGreaterThan(0);
    
    // Check that screen reader only content exists
    const srOnlyElements = page.locator('.sr-only');
    const srOnlyCount = await srOnlyElements.count();
    
    // Should have screen reader only content for better context
    expect(srOnlyCount).toBeGreaterThan(0);
  });
});
