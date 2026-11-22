// Copyright (c) 2026 Ali Razavi. All rights reserved. Owned and controlled solely by Ali Razavi: no licence check, no remote control, no backdoor. Terms: see the LICENSE file.
import { load, plan, startRun, completeRun, MODES } from './core.js';

const DAILY = 'daily', ENDED = 'ended';

// What is still open today: scheduled spots that are neither done nor skipped.
function open(st) {
  const p = plan(new Date(), st.cfg);
  return { p, left: p.req.filter((s) => !st.done.includes(s.id) && !st.skip.includes(s.id)) };
}

// One alarm for the next reminder time.
async function schedule() {
  const { cfg } = await load();
  const when = new Date();
  when.setHours(0, cfg.at, 0, 0);
  if (when <= Date.now()) when.setDate(when.getDate() + 1);
  chrome.alarms.create('daily', { when: when.getTime() });
}

// Badge: ▶ while a timer runs, otherwise nothing. The spots-left count lives in the hover title only.
async function sync() {
  const st = await load();
  const { p, left } = open(st);
  chrome.action.setBadgeBackgroundColor({ color: '#d8432e' });
  chrome.action.setBadgeText({ text: st.run ? '▶' : '' });
  chrome.action.setTitle({ title: `Mito Light\n${p.title}${p.req.length ? ` · ${left.length} of ${p.req.length} spots left` : ''}` });
  if (!left.length) chrome.notifications.clear(DAILY);
}

async function remind() {
  const st = await load();
  const { p, left } = open(st);
  if (!st.cfg.remind || !left.length || st.run) return;
  await chrome.notifications.clear(DAILY);
  chrome.notifications.create(DAILY, {
    type: 'basic',
    iconUrl: 'icon128.png',
    title: `Red light: ${p.title}`,
    message: `${left.length} spot${left.length > 1 ? 's' : ''} · ${left.reduce((n, s) => n + s.min, 0)} min\n${left.map((s) => s.name).join(', ')}`,
    buttons: [{ title: 'Open' }, { title: 'Snooze 30 min' }],
    requireInteraction: true,
    priority: 2,
  });
}

// A timer ran out. The sound matters: on face passes his eyes are covered.
async function timerDone() {
  const r = await completeRun();
  if (!r) return;
  await chrome.notifications.clear(ENDED);
  const n = r.next;
  chrome.notifications.create(ENDED, {
    type: 'basic',
    iconUrl: 'icon128.png',
    title: `${r.step.name} done ✓`,
    message: n ? `Next: ${n.name} · ${n.min} min${n.mode ? ` · ${MODES[n.mode]}` : ''}\nMove the light, then start.` : 'That was the last spot for today. Switch the light off.',
    buttons: n ? [{ title: `▶ Start ${n.name}` }, { title: 'Later' }] : [],
    requireInteraction: true,
    silent: false,
    priority: 2,
  });
}

const openPopup = async () => {
  try {
    await chrome.action.openPopup();
  } catch {
    chrome.windows.create({ url: 'popup.html', type: 'popup', width: 392, height: 720 });
  }
};

chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name === 'timer') return timerDone();
  await remind();
  if (a.name === 'daily') await schedule();
});

chrome.notifications.onClicked.addListener((id) => (chrome.notifications.clear(id), openPopup()));

chrome.notifications.onButtonClicked.addListener(async (id, button) => {
  chrome.notifications.clear(id);
  if (id === DAILY) return button ? chrome.alarms.create('snooze', { delayInMinutes: 30 }) : openPopup();
  if (button === 0) {
    const st = await load();
    const next = open(st).left[0];
    if (next) await startRun(next.id);
  }
});

// The popup writes straight to storage; react to it here.
chrome.storage.onChanged.addListener((changes) => {
  if (changes.cfg) schedule();
  sync();
});

chrome.runtime.onInstalled.addListener(() => (schedule(), sync()));
chrome.runtime.onStartup.addListener(() => (schedule(), sync()));
