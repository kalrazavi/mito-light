// Year calendar. A day with every scheduled spot done gets a check, a day with some gets a half mark,
// a past day with none gets a cross. Sundays are rest days and never count as missed.

import { key } from './core.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const full = (e) => e && e.req > 0 && e.got >= e.req;

// Full days in a row, counting back from today (or yesterday if today is still open). Rest days don't break it.
export function streak(st) {
  const d = new Date();
  if (!full(st.hist[key(d)])) d.setDate(d.getDate() - 1);
  let n = 0;
  for (; key(d) >= st.since; d.setDate(d.getDate() - 1)) {
    if (full(st.hist[key(d)])) n++;
    else if (d.getDay() !== 0) break;
  }
  return n;
}

export function calendar(year, st) {
  let ok = 0, part = 0, miss = 0;
  const months = MONTHS.map((name, m) => {
    const pad = '<i></i>'.repeat((new Date(year, m, 1).getDay() + 6) % 7);
    const count = new Date(year, m + 1, 0).getDate();
    let cells = '';
    for (let d = 1; d <= count; d++) {
      const date = new Date(year, m, d);
      const k = key(date);
      const label = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      const e = st.hist[k];
      const now = k === st.day ? ' now' : '';
      const past = k >= st.since && k < st.day;
      if (full(e)) { ok++; cells += `<i class="ok${now}" title="${label} · ${e.got}/${e.req} spots · ${e.min} min">✓</i>`; }
      else if (e?.min) { part++; cells += `<i class="part${now}" title="${label} · ${e.got}/${e.req} spots · ${e.min} min">◐</i>`; }
      else if (date.getDay() === 0 && (past || now)) cells += `<i class="rest${now}" title="${label} · rest day">·</i>`;
      else if (past) { miss++; cells += `<i class="miss" title="${label} · missed">×</i>`; }
      else cells += `<i class="day${now}" title="${label}${now ? ' · today' : ''}"></i>`;
    }
    return `<div class="month"><b>${name}</b><div class="grid"><u>M</u><u>T</u><u>W</u><u>T</u><u>F</u><u>S</u><u>S</u>${pad}${cells}</div></div>`;
  }).join('');

  const run = streak(st);
  return `
    <div class="yearnav">
      <button data-y="${year - 1}" ${year <= +st.since.slice(0, 4) ? 'disabled' : ''} aria-label="Previous year">‹</button>
      <strong>${year}</strong>
      <button data-y="${year + 1}" aria-label="Next year">›</button>
    </div>
    <div class="months">${months}</div>
    <p class="stats"><span class="g">✓ ${ok} full</span><span>◐ ${part} partial</span><span class="r">× ${miss} missed</span><span>${run} in a row</span></p>`;
}
