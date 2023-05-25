import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Otokoc', async ({ page }) => {
  await page.goto('https://www.otokocikinciel.com/');
  await page.goto('https://www.otokocikinciel.com/ikinci-el-araba');
  await page.getByRole('combobox', { name: 'Marka' }).selectOption('fiat');
  await page.getByRole('combobox', { name: 'Model' }).selectOption('egea');
  await page.locator('label').filter({ hasText: 'Dizel' }).click();
  await page.locator('label').filter({ hasText: 'Manuel' }).click();
  await page.getByRole('button', { name: 'Araç Bul' }).click();

  const filePath = './output.json';
  const data = { urls: [] };

  const button = await page.$('button[name="TÜMÜNÜ ONAYLA"]');
  if (button) {
    await button.click();
  }

  while (true) {
    const elements = await page.$$('.col-md-4.impression_product');
    for (const element of elements) {
      const href = await element.$eval('a', (a) => a.href);
      data.urls.push(href);
    }

    const nextButton = await page.$('a[aria-label="İleri"]');
    if (nextButton) {
      await nextButton.click();
    } else {
      break;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`URLs have been saved to ${filePath}.`);
});
