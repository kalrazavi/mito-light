// Copyright (c) 2026 Ali Razavi. All rights reserved. Owned and controlled solely by Ali Razavi: no licence check, no remote control, no backdoor. Terms: see the LICENSE file.
import { load, plan, mark, resetDay, startRun, stopRun, completeRun, saveCfg, clock, tip, key, neckOnMonday, thuSide, MODES, REF, EVIDENCE, specDose } from './core.js';
import { body } from './body.js';
import { calendar, streak } from './calendar.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

let sel = null; // spot the user tapped, or null to follow the next open one
let viewKey = null; // day being looked at (YYYY-MM-DD), or null for today
let view = 'main'; // or 'cal'
let calYear = new Date().getFullYear();
let editOpen = false; // the card's "Edit this spot" drawer
let run = null; // the running timer, mirrored from storage for the ticker
let lastDone = null; // spot just checked off

async function render() {
  const st = await load();
  run = st.run;
  const today = new Date();
  const date = viewKey && viewKey !== st.day ? new Date(viewKey + 'T12:00') : today;
  const isToday = date === today;
  const p = plan(date, st.cfg);
  const h = st.hist[key(date)] || { done: [], skip: [] };
  const state = (s) => (isToday && run?.id === s.id ? 'run' : h.done.includes(s.id) ? 'done' : h.skip.includes(s.id) ? 'skip' : '');
  const openSteps = p.steps.filter((s) => !state(s) || state(s) === 'run');

  // The card follows the running timer, then your tap, then the next open scheduled spot.
  const shown = (isToday && run && p.steps.find((s) => s.id === run.id))
    || p.steps.find((s) => s.id === sel)
    || (isToday ? openSteps.find((s) => !s.opt) : p.steps[0])
    || null;

  const gotMin = p.steps.filter((s) => h.done.includes(s.id)).reduce((n, s) => n + s.min, 0);
  const over = p.reqMin > st.cfg.cap;
  $('count').innerHTML = p.req.length ? `${gotMin} of <span class="${over ? 'warn' : ''}" title="${over ? `Over your ${st.cfg.cap} min daily ceiling` : `Daily ceiling ${st.cfg.cap} min`}">${p.reqMin} min</span>` : 'rest day';

  $('main').classList.toggle('off', view !== 'main');
  $('cal').classList.toggle('off', view !== 'cal');
  $('viewbtn').textContent = view === 'cal' ? '← Today' : 'Calendar';
  if (view === 'cal') $('cal').innerHTML = calendar(calYear, st) + `<p class="why">${tip(st.day + calYear)}</p>`;

  // Monday to Sunday of this week.
  const mon = new Date(today);
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  $('week').replaceChildren(...[0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const k = key(d), e = st.hist[k], dp = plan(d, st.cfg);
    const b = document.createElement('button');
    const full = e && e.req > 0 && e.got >= e.req;
    b.className = [k === st.day && 'today', k === key(date) && 'sel', full && 'done', !dp.req.length && 'rest'].filter(Boolean).join(' ');
    b.innerHTML = `<b>${'MTWTFSS'[i]}</b><i>${full ? '✓' : dp.req.length ? dp.reqMin : '–'}</i>`;
    b.title = `${d.toLocaleDateString([], { weekday: 'long' })} · ${dp.title}${dp.req.length ? ` · ${dp.reqMin} min` : ''}`;
    b.onclick = () => { viewKey = k; sel = null; editOpen = false; render(); };
    return b;
  }));
  $('dayline').innerHTML = `<b>${isToday ? 'Today' : date.toLocaleDateString([], { weekday: 'long' })}</b> · ${esc(p.title)} <span>${esc(p.tag)}</span>`;

  $('body').innerHTML = body(p.steps, state, shown?.id);
  $('bar').firstElementChild.style.width = `${p.reqMin ? Math.min(100, (gotMin / p.reqMin) * 100) : 0}%`;

  $('trail').replaceChildren(...p.steps.map((s) => {
    const b = document.createElement('button');
    b.className = [state(s), s.opt && 'opt', s === shown && 'sel'].filter(Boolean).join(' ');
    b.title = `${s.name} · ${s.min} min${s.opt ? ' · optional' : ''}`;
    b.onclick = () => pick(s.id);
    return b;
  }));

  const el = document.activeElement;
  if (!(el && $('card').contains(el) && /INPUT|SELECT/.test(el.tagName))) {
    if (shown) drawStep(shown, p, state(shown), isToday, st);
    else drawRest(p, st, gotMin, isToday);
  }
  $('reset').classList.toggle('off', !isToday || !(h.done.length + h.skip.length));
  drawSettings(st, today);
}

const pick = (id) => { sel = sel === id ? null : id; editOpen = false; render(); };

function drawStep(s, p, state, isToday, st) {
  const i = p.steps.indexOf(s);
  const arrow = (t, sign, name) => `<button data-go="${t?.id ?? ''}" ${t ? '' : 'disabled'} aria-label="${name} spot">${sign}</button>`;
  const light = st.cfg.lights[s.light];
  const warn = s.min > REF.min[1] ? `<p class="note">Above the ${REF.min[0]} to ${REF.min[1]} min per area that MITO LIGHT lists.</p>` : '';
  const buttons = !isToday ? '<p class="cue">Preview. You can check spots off on the day itself.</p>'
    : state === 'run' ? `<button id="timer" class="running"></button><button id="done" class="primary">✓ Done</button>`
    : state === 'done' ? '<button id="undo" class="undo">Done ✓ · undo</button>'
    : state === 'skip' ? '<button id="undo" class="undo">Skipped · undo</button>'
    : `<button id="timer">▶ ${clock(s.min * 60)} timer</button><button id="done" class="primary">✓ Done</button>${s.opt ? '<button id="skip" class="slim">Skip</button>' : ''}`;

  $('card').innerHTML = `
    <div class="nav">${arrow(p.steps[i - 1], '‹', 'Previous')}<p class="when">Spot ${i + 1} of ${p.steps.length}${s.opt ? ' · <b>optional</b>' : ''}</p>${arrow(p.steps[i + 1], '›', 'Next')}</div>
    <h2>${esc(s.name)}</h2>
    <p class="chips">
      <span class="chip time">${s.min} min</span>
      <span class="chip ${s.mode || 'unset'}">${MODES[s.mode]}</span>
      <span class="chip ${light ? '' : 'unset'}">${light ? esc(light.name) : 'Light not set'}</span>
      <span class="chip ${s.cm ? '' : 'unset'}">${s.cm ? esc(s.cm) + ' cm' : 'Distance not set'}</span>
    </p>
    ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}${warn}
    <p class="cue">${esc(s.care)}</p>
    <p class="why"><b>What to expect <i class="ev ${s.ev}">${EVIDENCE[s.ev]}</i></b>${esc(s.why)}</p>
    <p class="why"><b>Length</b>Your timer is ${s.min} min. ${esc(s.study)} MITO LIGHT's own range is ${REF.min[0]} to ${REF.min[1]} min per area.
      <span class="dose">At 15 cm, ${s.min} min is about ${specDose(s.min)} J/cm² going by the bulb's listed output (centre of beam, not measured per mode).</span></p>
    <div class="row">${buttons}</div>
    ${s.cam ? '<button id="cam" class="camlink">📷 Check position with the webcam</button>' : ''}
    <details id="edit" ${editOpen ? 'open' : ''}>
      <summary>Edit this spot</summary>
      <div class="edit">
        <label>Minutes <input type="number" id="e-min" min="1" max="30" value="${s.min}"></label>
        <label>Distance <input type="number" id="e-cm" min="1" max="100" placeholder="${REF.cm[0]}–${REF.cm[1]}" value="${esc(st.cfg.spots[s.id]?.cm ?? '')}"> cm</label>
        <label>Mode <select id="e-mode">${Object.entries(MODES).map(([k, v]) => `<option value="${k}" ${k === s.mode ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label>Light <select id="e-light"><option value="">Not set</option>${['a', 'b'].map((k) => `<option value="${k}" ${k === s.light ? 'selected' : ''}>${esc(st.cfg.lights[k].name)}</option>`).join('')}</select></label>
      </div>
    </details>`;

  $('edit').ontoggle = () => { editOpen = $('edit').open; };
  const saveSpot = async () => {
    const mins = { ...st.cfg.mins }, m = Math.round(+$('e-min').value);
    if (m > 0 && m !== s.base) mins[`${p.dow}.${s.id}`] = Math.min(m, 30);
    else delete mins[`${p.dow}.${s.id}`];
    const spots = { ...st.cfg.spots, [s.id]: { mode: $('e-mode').value, light: $('e-light').value, cm: $('e-cm').value } };
    document.activeElement?.blur();
    await saveCfg({ mins, spots });
    render();
  };
  for (const id of ['e-min', 'e-cm', 'e-mode', 'e-light']) $(id).onchange = saveSpot;

  if ($('cam')) $('cam').onclick = () => {
    const url = `camera.html?spot=${s.id}`;
    if (globalThis.chrome?.windows) chrome.windows.create({ url, type: 'popup', width: 440, height: 720 });
    else window.open(url);
  };
  if ($('done')) $('done').onclick = () => finish(s.id, 'done');
  if ($('skip')) $('skip').onclick = () => finish(s.id, 'skip');
  if ($('undo')) $('undo').onclick = async () => { sel = s.id; await mark(s.id, null); render(); };
  if ($('timer')) $('timer').onclick = async () => { await (state === 'run' ? stopRun() : startRun(s.id)); render(); };
  tick();
}

function drawRest(p, st, gotMin, isToday) {
  const n = streak(st);
  const did = p.steps.find((s) => s.id === lastDone);
  const title = !p.req.length ? 'Rest day' : 'All spots done ✓';
  const text = !p.req.length ? 'No red light today. Feet are optional, 5 minutes each. Tap a dot above if you want them.'
    : `${gotMin} minutes today. ${n > 1 ? `${n} days in a row. ` : ''}Switch the light off.`;
  $('card').innerHTML = `<div class="nav"><button data-go="${p.steps.at(-1)?.id ?? ''}" aria-label="Previous spot">‹</button><p class="when">${isToday ? 'Today' : 'Preview'}</p><button disabled>›</button></div>
    <h2>${title}</h2><p class="cue" style="margin-top:6px">${text}</p>
    <p class="why"><b>${did ? `Why ${esc(did.name.toLowerCase())}` : 'Worth knowing'}</b>${did ? esc(did.why) : tip(st.day + new Date().getHours())}</p>`;
}

async function finish(id, how) {
  if (run?.id === id) await stopRun();
  lastDone = how === 'done' ? id : null;
  sel = null;
  editOpen = false;
  await mark(id, how);
  render();
}

// ---- timer ----
// The countdown is read from storage, so reopening the popup picks it straight back up.

let ending = false;
async function tick() {
  const b = $('timer');
  if (!run) return;
  const left = Math.ceil((run.end - Date.now()) / 1000);
  if (left > 0) {
    if (b?.classList.contains('running')) b.textContent = `${clock(left)} · stop ✕`;
    return;
  }
  if (ending) return;
  ending = true;
  const r = await completeRun();
  if (r) { beep(); lastDone = r.step.id; sel = null; }
  ending = false;
  render();
}
setInterval(tick, 250);

function beep() {
  try {
    const ac = new AudioContext();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ac.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.2);
      o.connect(g).connect(ac.destination);
      o.start(ac.currentTime + t);
      o.stop(ac.currentTime + t + 0.2);
    });
  } catch { /* no sound available */ }
}

// ---- clicks on the figure and the card arrows ----

$('body').onclick = (e) => { const id = e.target.dataset?.id; if (id) pick(id); };
$('card').addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (!b || b.disabled || !b.dataset.go) return;
  sel = b.dataset.go;
  editOpen = false;
  render();
});

$('viewbtn').onclick = () => {
  view = view === 'cal' ? 'main' : 'cal';
  viewKey = null;
  calYear = new Date().getFullYear();
  render();
};
$('cal').onclick = (e) => {
  const y = e.target.closest('[data-y]');
  if (y && !y.disabled) { calYear = +y.dataset.y; render(); }
};

let armed; // reset needs a second tap within 3 seconds
$('reset').onclick = async () => {
  if (!armed) {
    $('reset').textContent = 'Tap again to reset';
    armed = setTimeout(() => { armed = null; $('reset').textContent = 'Reset today'; }, 3000);
    return;
  }
  clearTimeout(armed);
  armed = null;
  $('reset').textContent = 'Reset today';
  sel = null;
  await resetDay();
  render();
};

// ---- settings ----

const hhmm = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
const FIELDS = [['name', 'Name'], ['model', 'Model'], ['cm', 'Distance (cm)'], ['nm', 'Wavelengths']];

function drawSettings(st, today) {
  if ($('settings').contains(document.activeElement) && /INPUT/.test(document.activeElement.tagName)) return;
  const { cfg } = st;
  $('remind').checked = cfg.remind;
  $('at').value = hhmm(cfg.at);
  $('cap').value = cfg.cap;
  $('neckday').textContent = neckOnMonday(today, cfg) ? 'Monday' : 'Thursday';
  $('side').textContent = thuSide(today, cfg) === 'L' ? 'Left' : 'Right';
  $('lights').innerHTML = ['a', 'b'].map((k) => `<fieldset><legend>${esc(cfg.lights[k].name)}</legend>${
    FIELDS.map(([f, label]) => `<label>${label}<input data-light="${k}" data-f="${f}" ${f === 'cm' ? 'type="number" min="1" max="100"' : ''} value="${esc(cfg.lights[k][f])}"></label>`).join('')
  }</fieldset>`).join('');
  $('ref').textContent = `MITO LIGHT lists ${REF.cm[0]} to ${REF.cm[1]} cm and ${REF.min[0]} to ${REF.min[1]} minutes per area, at most ${REF.dayMax} minutes on the same area in a day. Wear the goggles for face passes, stop if skin gets painfully hot, and skip any area with a suspected clot or cancer. The Bulb 4.0 details are from what you remember; check each label and correct them here.`;
}

$('remind').onchange = () => saveCfg({ remind: $('remind').checked }).then(render);
$('at').onchange = () => {
  const [h, m] = $('at').value.split(':').map(Number);
  if (!isNaN(h)) saveCfg({ at: h * 60 + m });
};
$('cap').onchange = () => { const v = Math.round(+$('cap').value); if (v > 0) { $('cap').blur(); saveCfg({ cap: v }).then(render); } };
$('neckflip').onclick = async () => { await saveCfg({ neckFlip: !(await load()).cfg.neckFlip }); render(); };
$('sideflip').onclick = async () => { await saveCfg({ sideFlip: !(await load()).cfg.sideFlip }); render(); };
$('lights').onchange = async (e) => {
  const { light, f } = e.target.dataset;
  if (!light) return;
  const { lights } = (await load()).cfg;
  lights[light] = { ...lights[light], [f]: e.target.value.trim() || (f === 'name' ? lights[light].name : '') };
  e.target.blur();
  await saveCfg({ lights });
  render();
};

globalThis.chrome?.storage?.onChanged.addListener(() => render());
setInterval(render, 30000);
render();
