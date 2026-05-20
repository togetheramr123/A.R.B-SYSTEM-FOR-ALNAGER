import { test, expect } from '@playwright/test';

test('UOM functionality on product form', async ({ page }) => {
    // Navigate to new product form
    await page.goto('http://localhost:3000/inventory/products/new');

    // Wait for it to load
    await page.waitForSelector('input[name="name"]');

    // Enter a random product name
    const productName = `Test Product ${Date.now()}`;
    await page.fill('input[name="name"]', productName);

    // Locate the PRIMARY UOM combobox and try to create a new one
    // Click the manage UOMs button
    const uomManageBtn = page.locator('button[title="إدارة وحدات القياس"]').first();
    await uomManageBtn.click();

    const addLineBtn = page.getByRole('button', { name: 'إضافة بند' }).last();
    await addLineBtn.click();

    // Fill the last input in the table with 'Test Primary UOM'
    const newUomInput = page.locator('input[placeholder="اسم الوحدة"]').last();
    await newUomInput.fill('Test Primary UOM');

    const saveDialogBtn = page.getByRole('button', { name: 'حفظ التعديلات' }).last();
    await saveDialogBtn.click();
    await saveDialogBtn.waitFor({ state: 'hidden' });
    console.log("Primary UOM created via dialog.");

    // Verify Secondary UOM checkbox exists and check it
    const secondaryCheckbox = page.locator('input[name="hasSecondaryUnit"]');
    await secondaryCheckbox.check();

    const secondaryUomInput = page.locator('input[placeholder="اختر وحدة ثانوية..."]').first();
    await expect(secondaryUomInput).toBeVisible();

    // Click the manage secondary UOMs button
    const secondaryUomManageBtn = page.locator('button[title="إدارة وحدات القياس"]').last();
    await secondaryUomManageBtn.click();

    await addLineBtn.click();
    const newSecondaryUomInput = page.locator('input[placeholder="اسم الوحدة"]').last();
    await newSecondaryUomInput.fill('Test Secondary UOM');

    await saveDialogBtn.click();
    await saveDialogBtn.waitFor({ state: 'hidden' });
    console.log("Secondary UOM created via dialog.");

    // Verify conversion factor input is visible
    const conversionFactorInput = page.locator('input[name="secondaryUomFactor"]');
    await expect(conversionFactorInput).toBeVisible();
    await conversionFactorInput.fill('12');
});
