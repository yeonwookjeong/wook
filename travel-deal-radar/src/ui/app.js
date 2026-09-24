import { analyzeDeal, analyzeQuick } from '../core/dealScore.js';
import { DAY_TYPE_LABEL } from '../core/calendar.js';
import { loadSampleWatchlist, SAMPLE_TODAY } from '../data/sample.js';

const won = (n) => `₩${Math.round(n).toLocaleString('ko-KR')}`;
const pct = (d) => `${d >= 0 ? '-' : '+'}${Math.abs(Math.round(d * 100))}%`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const state = { kind: 'all', dealsOnly: false };

// 앱 시작 시 한 번 분석해두고, 필터만 바꿔서 다시 그린다.
const analyzed = loadSampleWatchlist(SAMPLE_TODAY)
  .map((item) => {
    try {
      return { item, r: analyzeDeal({ kind: item.kind, history: item.history, offer: item.offer, today: SAMPLE_TODAY, recentQuotes: item.recentQuotes }) };
    } catch (e) {
      console.error(item.id, e);
      return null;
    }
  })
  .filter(Boolean)
  .sort((a, b) => b.r.discount - a.r.discount);

function rangeBar(r, price) {
  // 표시 범위: 과거 최저 ~ max(p75, 현재가) 에 여백
  const lo = Math.min(r.min, price) * 0.9;
  const hi = Math.max(r.p75 * 1.25, price * 1.05);
  const x = (v) => `${(((v - lo) / (hi - lo)) * 100).toFixed(1)}%`;
  return `
    <div class="range" aria-hidden="true">
      <div class="track"></div>
      <div class="iqr" style="left:${x(r.p25)};width:calc(${x(r.p75)} - ${x(r.p25)})"></div>
      <div class="med" style="left:${x(r.baseline)}"></div>
      <div class="now ${price > r.baseline ? 'up' : ''}" style="left:${x(price)}"></div>
    </div>
    <div class="legend"><span>과거 최저 ${won(r.min)}</span><span>보통 ${won(r.p25)}~${won(r.p75)}</span></div>`;
}

function reasonsHtml(reasons, checklist, open = false) {
  if (!reasons.length && !checklist.length) return '';
  const rs = reasons
    .map((x) => `<p class="reason"><span class="t">${esc(x.title)}</span><span class="conf">${esc(x.confidence)}</span><br>${esc(x.detail)}</p>`)
    .join('');
  const cl = checklist.length ? `<p class="reason t">예약 전 체크</p><ul class="check">${checklist.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : '';
  return `<details ${open ? 'open' : ''}><summary>왜 쌀까?</summary>${rs}${cl}</details>`;
}

function card({ item, r }) {
  const o = item.offer;
  const lead = r.leadDays === 0 ? '오늘' : `${r.leadDays}일 후`;
  const when = item.kind === 'hotel' ? `${o.date} 1박` : `${o.date} 출발`;
  return `
    <article class="card">
      <div class="row">
        <div>
          <div class="name">${item.kind === 'hotel' ? '🏨' : '✈️'} ${esc(item.name)}</div>
          <div class="meta">${esc(item.area)} · ${when} (${DAY_TYPE_LABEL[r.dayType]}, ${lead}) · ${esc(o.source)}${o.refundable === false ? ' · 환불불가' : ''}</div>
        </div>
        <div class="price">
          <b>${won(o.price)}</b><br>
          <s>평소 ${won(r.baseline)}</s>
        </div>
      </div>
      <div style="margin-top:8px">
        <span class="badge ${r.grade.id}">${r.grade.emoji} ${r.grade.label} ${pct(r.discount)}</span>
        <span class="meta">· ${esc(r.basis)} ${r.sampleCount}건 중 ${Math.round(r.cheaperThanShare * 100)}%보다 쌈${r.confidence === 'low' ? ' · 표본 부족' : ''}</span>
      </div>
      ${rangeBar(r, o.price)}
      ${reasonsHtml(r.reasons, r.checklist, r.grade.id === 'steal')}
    </article>`;
}

function render() {
  const rows = analyzed.filter(({ item, r }) => (state.kind === 'all' || item.kind === state.kind) && (!state.dealsOnly || r.discount >= 0.15));
  document.getElementById('list').innerHTML = rows.length ? rows.map(card).join('') : '<p class="empty">조건에 맞는 딜이 없어요.</p>';
}

document.getElementById('today').textContent = SAMPLE_TODAY;
document.querySelectorAll('.seg button').forEach((btn) =>
  btn.addEventListener('click', () => {
    state.kind = btn.dataset.kind;
    document.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    render();
  }),
);
document.getElementById('deals-only').addEventListener('change', (e) => {
  state.dealsOnly = e.target.checked;
  render();
});

document.getElementById('quick').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const out = document.getElementById('quick-result');
  try {
    const r = analyzeQuick({
      kind: f.get('kind'),
      price: Number(f.get('price')),
      usualPrice: Number(f.get('usualPrice')),
      peakPrice: Number(f.get('peakPrice')),
      isPeak: f.get('isPeak') === '1',
      leadDays: Number(f.get('leadDays')) || 0,
      refundable: f.get('refundable') === '1',
    });
    out.innerHTML = `<div class="card">
      <span class="badge ${r.grade.id}">${r.grade.emoji} ${r.grade.label} ${pct(r.discount)}</span>
      <span class="meta">· 비교 기준 ${won(r.baseline)}</span>
      ${reasonsHtml(r.reasons, r.checklist, true)}
    </div>`;
  } catch (err) {
    out.innerHTML = `<p class="err">${esc(err.message)}</p>`;
  }
});

render();
