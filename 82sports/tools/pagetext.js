// 페이지 본문 텍스트: node pagetext.js url [최대글자]
const { chromium } = require('playwright');
(async () => { const [u, n] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ locale:'en-US', timezoneId:'Asia/Seoul' });
  try { await p.goto(u, { waitUntil:'domcontentloaded', timeout:45000 }); await p.waitForTimeout(6000);
    const t = await p.evaluate(()=>document.body.innerText); console.log(t.replace(/\n{2,}/g,'\n').slice(0, +n||6000)); }
  catch(e){ console.log('ERR', e.message.slice(0,100)); }
  await b.close(); })();
