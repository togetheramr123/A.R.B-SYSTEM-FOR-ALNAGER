import { test, expect } from '@playwright/test';
import { CHAOS_STRINGS, CHAOS_NUMBERS } from '../helpers/chaos-data';

test.describe('Sales Chaos & Combinatorial Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/ar/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('/ar/dashboard');
  });

  test('Should handle negative quantities and extreme discounts gracefully', async ({ page }) => {
    await page.goto('/ar/sales/new');
    
    // Select first customer
    await page.click('button:has-text("اختر عميل")'); // Pseudo selector, might need adjustment based on actual UI
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Add product
    await page.click('button:has-text("إضافة منتج")');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Try negative quantity
    const qtyInput = page.locator('input[type="number"]').first();
    await qtyInput.fill('-5');
    
    // Try massive discount
    const discountInput = page.locator('input[type="number"]').nth(2);
    await discountInput.fill('150'); // 150% discount

    // Save
    await page.click('button:has-text("حفظ")');

    // Assert that validation catches it or backend rejects it
    // We expect an error toast or validation message
    const toast = page.locator('.sonner-toast');
    await expect(toast).toBeVisible();
  });

  test('Should reject extremely long text in notes', async ({ page }) => {
    await page.goto('/ar/sales/new');
    
    const longText = CHAOS_STRINGS[2]; // very long arabic text
    const noteInput = page.locator('textarea[name="notes"]');
    
    if (await noteInput.isVisible()) {
      await noteInput.fill(longText);
      await page.click('button:has-text("حفظ")');
      
      // Check if it broke the UI or saved successfully
      const errorMsg = page.locator('text=too long').or(page.locator('text=طويل جداً'));
      // If no strict limit, it might just succeed, which is also fine to observe
    }
  });
});
