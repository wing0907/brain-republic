// docs/*.md → docs/pdf/*.pdf (marked로 HTML 변환 후 Chromium print-to-pdf)
// Chromium 경로: CHROME_PATH 환경변수 > ms-playwright 캐시 > 설치된 Chrome 순으로 탐색.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { marked } from 'marked';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'pdf');
mkdirSync(outDir, { recursive: true });

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
  if (existsSync(cache)) {
    const dir = readdirSync(cache).filter((d) => d.startsWith('chromium-')).sort().pop();
    if (dir) {
      const p = join(cache, dir, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing');
      if (existsSync(p)) return p;
    }
  }
  const sys = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (existsSync(sys)) return sys;
  throw new Error('Chromium을 찾을 수 없습니다. CHROME_PATH를 지정하세요.');
}

const CSS = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
         color: #1f2430; line-height: 1.62; font-size: 10.5pt; }
  h1 { font-size: 19pt; border-bottom: 3px solid #ff8c42; padding-bottom: 8px; }
  h2 { font-size: 13.5pt; margin-top: 1.6em; color: #6b3fa0; }
  h3 { font-size: 11.5pt; margin-top: 1.2em; }
  strong { color: #b5443c; }
  blockquote { border-left: 4px solid #ff8c42; margin: 1em 0; padding: 2px 14px;
               color: #555; background: #fff7ef; }
  table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 9.5pt; }
  th, td { border: 1px solid #cfc6de; padding: 6px 9px; text-align: left; vertical-align: top; }
  th { background: #f0eaf8; }
  code { background: #f2eefa; padding: 1px 5px; border-radius: 4px; font-size: 9pt; }
  pre { background: #241638; color: #e8dff5; padding: 12px 14px; border-radius: 8px;
        font-size: 8.5pt; overflow-x: hidden; white-space: pre-wrap; }
  pre code { background: none; color: inherit; }
  hr { border: none; border-top: 1px solid #d8cfec; margin: 1.4em 0; }
  a { color: #6b3fa0; }
`;

const targets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['GAME_INTRO.md', 'AI_TECH_DOC.md', 'TEAM_ROLES.md'];

const exe = findChrome();
const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage();

for (const name of targets) {
  const md = readFileSync(join(root, 'docs', name), 'utf8');
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
    <style>${CSS}</style></head><body>${marked.parse(md)}</body></html>`;
  const tmp = join(outDir, name.replace(/\.md$/, '.html'));
  writeFileSync(tmp, html);
  const pdfPath = join(outDir, name.replace(/\.md$/, '.pdf'));
  await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  console.log('✓', pdfPath);
}

await browser.close();
