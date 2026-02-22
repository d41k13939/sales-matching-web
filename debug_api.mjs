// ローカルAPIで実際のデータを確認する
const res = await fetch('http://localhost:3000/api/match', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ location: '', priceMin: null, priceType: 'hourly', workHours: '', timeSlot: '', startDate: '', remarks: '' })
});

if (!res.ok) {
  console.log('API error:', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
const items = data.matched || [];
console.log('マッチ件数:', items.length);
console.log('');

for (const item of items.slice(0, 3)) {
  console.log('=== 案件:', item.name.substring(0, 50), '===');
  console.log('fullText先頭150文字:', item.fullText.substring(0, 150));
  console.log('nameがfullTextの先頭に含まれる?', item.fullText.startsWith(item.name));
  console.log('nameがfullText内に含まれる?', item.fullText.includes(item.name));
  console.log('');
}
