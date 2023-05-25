import { test } from '@playwright/test';
import fs from 'fs';
import XLSX from 'xlsx';

const jsonDosyasi = 'output.json';
const jsonData = fs.readFileSync(jsonDosyasi, 'utf-8');
const data = JSON.parse(jsonData);
const ikinciDosya = 'ikinci.json';
const ikinciData = { urls: [] };

for (const [index, url] of data.urls.entries()) {
  test(`Araç ${index + 1}`, async ({ page }) => {
    await page.goto(url);
    
    const button = await page.$('button[name="TÜMÜNÜ ONAYLA"]');
    if (button) {
      await button.click();
    }

    // Aracın detaylarını al
    const aracDetaylari = await page.$$eval('table tr', (rows) => {
      return rows.map((row) => {
        const $tdElements = Array.from(row.querySelectorAll('td'));
        const baslik = $tdElements[0].innerText;
        const deger = $tdElements[1].innerText;
        return { [baslik]: deger };
      });
    });
    

    // Satici bilgilerini al
    const saticiBilgileri = await page.$eval('.ok-spccg-salesBox', (element) => {
      const yetkiliKisininRolu = element.querySelector('.ok-spccgsb-header')?.innerText || '';
      const isim = element.querySelector('.ok-spccgsb-name')?.innerText || '';
      const telefonNumarasi = element.querySelector('.ok-mobileContactButton')?.getAttribute('href') || '';

      return {
        yetkiliKisininRolu: yetkiliKisininRolu,
        isim: isim,
        telefonNumarasi: telefonNumarasi
      };
    });

    // İkinci dosyaya verileri ekle
    ikinciData.urls.push({
      url: url,
      aracDetaylari: aracDetaylari,
      saticiBilgileri: saticiBilgileri
    });
  });
}

test('Her URLyi Yazdır', async () => {
  fs.writeFileSync(ikinciDosya, JSON.stringify(ikinciData, null, 2));
  console.log(`Bilgiler kaydedildi: ${ikinciDosya}.`);

   // JSON verisini XLSX formatına dönüştür
   const sheetData = [];
   for (const urlData of ikinciData.urls) {
     sheetData.push({
       URL: urlData.url,
       ...urlData.aracDetaylari.reduce((acc, detay) => {
         const baslik = Object.keys(detay)[0];
         const deger = detay[baslik];
         return {
           ...acc,
           [baslik]: deger
         };
       }, {}),
       'Yetkili Kişinin Rolü': urlData.saticiBilgileri.yetkiliKisininRolu,
       'Telefon Numarası': urlData.saticiBilgileri.telefonNumarasi
     });
   }
 
   const worksheet = XLSX.utils.json_to_sheet(sheetData);
   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, 'Veri');
 
   // XLSX dosyasını oluştur
   const xlsxDosya = 'veri.xlsx';
   XLSX.writeFile(workbook, xlsxDosya);
   console.log(`XLSX dosyası oluşturuldu: ${xlsxDosya}`);
});
