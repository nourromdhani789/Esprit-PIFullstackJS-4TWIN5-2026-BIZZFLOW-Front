import { test, expect } from '@playwright/test';

/**
 * Invoice Workflow E2E Tests
 * Tests complete invoice creation to payment workflow
 */

test.describe('Invoice Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should create new invoice', async ({ page }) => {
    // Navigate to create invoice
    await page.click('[data-testid="nav-invoices"]');
    await page.click('[data-testid="create-invoice-button"]');
    
    // Select client
    await page.click('[data-testid="client-select"]');
    await page.click('[data-testid="client-option-1"]');
    
    // Add invoice items
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="item-description-0"]', 'Web Development');
    await page.fill('[data-testid="item-quantity-0"]', '10');
    await page.fill('[data-testid="item-price-0"]', '100');
    
    // Set due date
    await page.fill('[data-testid="due-date"]', '2024-12-31');
    
    // Save invoice
    await page.click('[data-testid="save-invoice-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Invoice created successfully');
    
    // Verify invoice number is generated
    await expect(page.locator('[data-testid="invoice-number"]')).toContainText('INV-');
  });

  test('should send invoice to client', async ({ page }) => {
    // Navigate to invoices
    await page.click('[data-testid="nav-invoices"]');
    
    // Click actions on first invoice
    await page.click('[data-testid="invoice-actions-0"]');
    
    // Click send
    await page.click('[data-testid="send-invoice"]');
    
    // Verify send modal
    await expect(page.locator('[data-testid="send-modal"]')).toBeVisible();
    
    // Fill email if needed
    const emailInput = page.locator('[data-testid="client-email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('client@example.com');
    }
    
    // Confirm send
    await page.click('[data-testid="confirm-send"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Invoice sent');
    
    // Verify status changed to sent
    await expect(page.locator('[data-testid="invoice-status-0"]')).toContainText('sent');
  });

  test('should mark invoice as paid', async ({ page }) => {
    // Navigate to invoices
    await page.click('[data-testid="nav-invoices"]');
    
    // Find an unpaid invoice and mark as paid
    const invoiceRows = page.locator('[data-testid="invoice-row"]');
    const count = await invoiceRows.count();
    
    for (let i = 0; i < count; i++) {
      const status = await invoiceRows.nth(i).locator('[data-testid="invoice-status"]').textContent();
      if (status !== 'paid') {
        // Click actions
        await invoiceRows.nth(i).locator('[data-testid="invoice-actions"]').click();
        
        // Click mark as paid
        await page.click('[data-testid="mark-paid"]');
        
        // Verify payment modal
        await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();
        
        // Fill payment details
        await page.fill('[data-testid="payment-amount"]', '1000');
        await page.selectOption('[data-testid="payment-method"]', 'transfer');
        
        // Confirm payment
        await page.click('[data-testid="confirm-payment"]');
        
        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toContainText('Payment recorded');
        
        // Verify status changed
        await expect(invoiceRows.nth(i).locator('[data-testid="invoice-status"]')).toContainText('paid');
        break;
      }
    }
  });

  test('should download invoice PDF', async ({ page }) => {
    // Navigate to invoices
    await page.click('[data-testid="nav-invoices"]');
    
    // Click actions on first invoice
    await page.click('[data-testid="invoice-actions-0"]');
    
    // Start waiting for download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-pdf"]'),
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should delete invoice with confirmation', async ({ page }) => {
    // Navigate to invoices
    await page.click('[data-testid="nav-invoices"]');
    
    // Get initial count
    const initialCount = await page.locator('[data-testid="invoice-row"]').count();
    
    // Click actions on first invoice
    await page.click('[data-testid="invoice-actions-0"]');
    
    // Click delete
    await page.click('[data-testid="delete-invoice"]');
    
    // Verify confirmation dialog
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Invoice deleted');
    
    // Verify count decreased
    await page.waitForTimeout(500);
    const newCount = await page.locator('[data-testid="invoice-row"]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should filter invoices by status', async ({ page }) => {
    // Navigate to invoices
    await page.click('[data-testid="nav-invoices"]');
    
    // Select status filter
    await page.selectOption('[data-testid="status-filter"]', 'paid');
    
    // Verify all displayed invoices are paid
    const invoiceStatuses = page.locator('[data-testid="invoice-status"]');
    const count = await invoiceStatuses.count();
    
    for (let i = 0; i < count; i++) {
      const status = await invoiceStatuses.nth(i).textContent();
      expect(status).toBe('paid');
    }
  });

  test('should search invoices', async ({ page }) => {
    // Navigate to invoices
    await page.click('[data-testid="nav-invoices"]');
    
    // Search for specific invoice
    await page.fill('[data-testid="search-input"]', 'INV-2024');
    
    // Wait for filter to apply
    await page.waitForTimeout(300);
    
    // Verify matching invoices are shown
    const invoiceNumbers = page.locator('[data-testid="invoice-number"]');
    const count = await invoiceNumbers.count();
    
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const number = await invoiceNumbers.nth(i).textContent();
      expect(number).toContain('INV-2024');
    }
  });
});
