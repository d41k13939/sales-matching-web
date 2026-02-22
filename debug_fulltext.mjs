import { readFileSync } from 'fs';

// .env.localを手動で読み込む
const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
}

const SHEET_URL = process.env.GOOGLE_SHEET_URL;
const csvUrl = SHEET_URL.replace('/edit?usp=sharing', '/export?format=csv&gid=0');

const res = await fetch(csvUrl);
const csv = await res.text();

// CSVをパース（簡易版）
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

const lines = csv.split('\n');
const nameRow = parseCSVLine(lines[0] || '');
const textRow = parseCSVLine(lines[1] || '');

console.log('案件数:', nameRow.length);
console.log('');

for (let i = 0; i < Math.min(3, nameRow.length); i++) {
  const name = nameRow[i]?.trim() || '';
  const text = textRow[i]?.trim() || '';
  if (!name && !text) continue;
  console.log(`=== 案件 ${i+1} ===`);
  console.log('name:', name.substring(0, 60));
  console.log('fullText先頭100文字:', text.substring(0, 100));
  console.log('nameがfullTextの先頭に含まれる?', text.startsWith(name));
  console.log('nameがfullText内に含まれる?', text.includes(name));
  console.log('');
}
