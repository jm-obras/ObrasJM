#!/usr/bin/env node
/**
 * Generate PDF from the HTML manual using Puppeteer
 * Usage: node scripts/html-to-pdf.mjs
 */
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'generate_manual_v3.html');
const outputPath = path.join(__dirname, '..', 'public', 'Manual_Usuario_ObrasJM_v3.2.pdf');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  });

  console.log(`PDF generated: ${outputPath}`);

  await browser.close();
})();
