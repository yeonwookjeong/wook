// 링크 목록: node links.js url 정규식
const { chromium } = require('playwright');
(async () => { const [u, re] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage();
  try { await p.goto(u, { waitUntil:'domcontentloaded', timeout:45000 }); await p.waitForTimeout(5000);
    const l = await p.evaluate(()=>[...document.querySelectorAll('a')].map(a=>a.innerText.trim().slice(0,100).replace(/\s+/g,' ')+' | '+a.href));
    const r = new RegExp(re,'i'); console.log([...new Set(l)].filter(x=>r.test(x)).join('\n')); }
  catch(e){ console.log('ERR', e.message.slice(0,100)); }
  await b.close(); })();
