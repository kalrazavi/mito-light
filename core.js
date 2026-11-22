// Copyright (c) 2026 Ali Razavi. All rights reserved. Owned and controlled solely by Ali Razavi: no licence check, no remote control, no backdoor. Terms: see the LICENSE file.
// Shared by the popup and the background worker: the spots, the weekly rotation, and storage.

// Never NIR on its own: every spot gets red, with or without NIR, so the skin benefits too.
export const MODES = { '': 'Mode not set', red: 'Red only', both: 'Red + NIR' };

// MITO LIGHT's own guidance for the Bulb 4.0 (product page and FAQ). Shown as a reference and
// used for gentle warnings, never enforced: the timers are Ali's routine.
export const REF = { cm: [15, 50], min: [10, 20], dayMax: 30 };
const BULB = { model: 'MITO LIGHT Bulb 4.0', nm: '630/660/670 red · 810/830/850 NIR' };

export const DEFAULT_CFG = {
  remind: true,
  at: 19 * 60, // reminder time, minutes from midnight
  cap: 40, // planning ceiling for one day's timer minutes
  neckFlip: false, // swap which weeks the front-of-neck session lands on Monday
  sideFlip: false, // swap which weeks Thursday's cheek is the left one
  lights: {
    a: { name: 'Mounted light', ...BULB, cm: '' },
    b: { name: 'Corded bulb', ...BULB, cm: '' },
  },
  spots: {}, // per-spot overrides: { mode, light, cm }
  mins: {}, // per-day timer overrides, keyed "weekday.spot"
};

// why: the realistic benefit, worded no stronger than the evidence. ev: how strong that evidence is.
// study: what the closest human studies actually used, so the timer has something to be compared with.
// z: where it glows on the figure, [view, dx from the figure's centre line, y, rx, ry].
export const EVIDENCE = { moderate: 'Moderate evidence', weak: 'Weak evidence', none: 'No evidence' };
const FACE_CARE = 'Wear the opaque goggles that came with the bulb, even on red only. This pass overlaps the other face passes, so the same skin gets more than one timer.';
const FACE_STUDY = 'Facial trials ran about twice a week for 30 sessions, at doses from roughly 9 to 126 J/cm² on different devices. None sets a length for this bulb.';
const MUSCLE_STUDY = 'Sports studies dose in total joules per muscle, mostly right before exercise, with probes or clusters. That does not convert to minutes for this bulb.';
const NONE_STUDY = 'No human protocol found for this use with a bulb like this, so there is no evidence-based length.';
export const SPOTS = {
  face: { cam: 1, name: 'Face front', mode: 'red', light: 'a', ev: 'moderate', why: 'Modest improvement in fine lines and skin texture. Judge it at 8 to 15 weeks of steady use.', study: FACE_STUDY, care: FACE_CARE, z: [['f', 0, 24, 9, 11]] },
  forehead: { cam: 1, name: 'Forehead', mode: 'red', light: 'a', ev: 'moderate', why: 'Same facial-skin goal: fine lines and texture over 8 to 15 weeks. The front-face pass reaches the forehead too.', study: FACE_STUDY, care: FACE_CARE, z: [['f', 0, 15, 8, 4.5]] },
  cheekL: { cam: 1, name: 'Left cheek + ear', mode: 'red', light: 'a', ev: 'moderate', why: 'Possible cheek texture improvement over weeks. Nothing is established for the ear.', study: FACE_STUDY, care: FACE_CARE, z: [['f', 9, 25, 5.5, 7]] },
  cheekR: { cam: 1, name: 'Right cheek + ear', mode: 'red', light: 'a', ev: 'moderate', why: 'Possible cheek texture improvement over weeks. Nothing is established for the ear.', study: FACE_STUDY, care: FACE_CARE, z: [['f', -9, 25, 5.5, 7]] },
  neckF: { name: 'Front of neck', mode: 'red', light: '', ev: 'weak', why: 'Possible improvement in neck wrinkles. A purpose-built neck device showed it by week 8 to 12; how well that carries over to this bulb is unknown.', study: 'Neck trials used 9 minutes, five days a week for 12 weeks (one at 25 mW/cm², 13.5 J/cm², red plus NIR). Once a week is far less often.', care: 'Kept red only, as you first set it; that is your preference, not a proven thyroid safeguard. The thyroid sits here, so with thyroid disease or a nodule ask a clinician first.', z: [['f', 0, 40, 6.5, 4]] },
  neckB: { name: 'Back of neck', mode: 'both', light: '', ev: 'none', why: 'No established nerve or general wellness benefit. This one is your own experiment.', study: NONE_STUDY, care: 'Keep the beam on the neck and away from your eyes.', z: [['b', 0, 40, 6.5, 4]] },
  chestL: { name: 'Left chest', mode: 'both', light: '', ev: 'weak', why: 'Local muscle recovery is possible. No reliable time to a noticeable effect.', study: MUSCLE_STUDY, care: 'The two chest passes overlap at the sternum. Count Friday\'s extra pass too.', z: [['f', 10, 57, 9, 8]] },
  chestR: { name: 'Right chest', mode: 'both', light: '', ev: 'weak', why: 'Local muscle recovery is possible. No reliable time to a noticeable effect.', study: MUSCLE_STUDY, care: 'The two chest passes overlap at the sternum. Count Friday\'s extra pass too.', z: [['f', -10, 57, 9, 8]] },
  bellyTop: { name: 'Upper belly', mode: 'both', light: '', ev: 'none', why: 'No established belly-fat or core benefit with this bulb.', study: 'Abdominal research used dedicated body-contouring devices and mixed protocols. Nothing transfers to a timer here.', care: 'Overlaps the lower belly pass.', z: [['f', 0, 75, 14, 6.5]] },
  bellyBottom: { name: 'Lower belly', mode: 'both', light: '', ev: 'none', why: 'No established spot fat loss or recovery effect.', study: 'Abdominal research used dedicated body-contouring devices and mixed protocols. Nothing transfers to a timer here.', care: 'Overlaps the upper belly and pelvic passes.', z: [['f', 0, 88, 14, 6.5]] },
  pelvic: { name: 'Pelvic area', mode: 'both', light: '', ev: 'none', why: 'No established benefit for routine exposure of a healthy pelvis, and none for fertility or testosterone.', study: NONE_STUDY, care: 'Above the pubic bone only. Keep the testes out of the beam; physiotherapy guidance advises against light over them.', z: [['f', 0, 101, 11, 5.5]] },
  shoulderL: { name: 'Left shoulder', mode: 'both', light: '', ev: 'weak', why: 'Possible short-term recovery after exercise. No reliable time to a noticeable effect.', study: MUSCLE_STUDY, care: 'Keep the lamp steady if you move it.', z: [['f', 23, 47, 7, 7]] },
  shoulderR: { name: 'Right shoulder', mode: 'both', light: '', ev: 'weak', why: 'Possible short-term recovery after exercise. No reliable time to a noticeable effect.', study: MUSCLE_STUDY, care: 'Keep the lamp steady if you move it.', z: [['f', -23, 47, 7, 7]] },
  calfL: { name: 'Left calf', mode: 'both', light: '', ev: 'weak', why: 'Possible help with exercise fatigue or soreness. An ongoing circulation benefit is unproven.', study: MUSCLE_STUDY + ' One review suggests 20 to 60 J in total for a calf.', care: 'Skip a calf that is newly swollen and painful until it has been checked.', z: [['b', -9, 146, 5.5, 13]] },
  calfR: { name: 'Right calf', mode: 'both', light: '', ev: 'weak', why: 'Possible help with exercise fatigue or soreness. An ongoing circulation benefit is unproven.', study: MUSCLE_STUDY + ' One review suggests 20 to 60 J in total for a calf.', care: 'Skip a calf that is newly swollen and painful until it has been checked.', z: [['b', 9, 146, 5.5, 13]] },
  crown: { name: 'Crown of scalp', mode: 'both', light: 'b', ev: 'weak', why: 'Some gain in hair density for pattern hair loss, seen at 16 weeks with dedicated red devices. Take a photo now and compare at four months.', study: 'The hair trials used red light (655 nm), 25 minutes every other day at a very low 2.4 mW/cm², about 3.5 J/cm².', care: 'Red + NIR includes the red the hair trials used; the NIR adds nothing proven for hair. Part your hair the same way each time.', z: [['b', 0, 13, 9, 5]] },
  footL: { name: 'Left foot', mode: 'both', light: '', ev: 'none', why: 'No established benefit for healthy feet. Fully optional.', study: NONE_STUDY, care: 'Keep the bulb supported and follow its clearance instructions.', z: [['f', 10, 179, 7, 4]] },
  footR: { name: 'Right foot', mode: 'both', light: '', ev: 'none', why: 'No established benefit for healthy feet. Fully optional.', study: NONE_STUDY, care: 'Keep the bulb supported and follow its clearance instructions.', z: [['f', -10, 179, 7, 4]] },
  extra: { name: 'Chest or calves', mode: 'both', light: '', ev: 'weak', why: 'One optional extra recovery pass. Pick whichever feels like it needs it.', study: MUSCLE_STUDY, care: 'One five-minute timer, not one per side.', z: [['f', 10, 57, 9, 8], ['f', -10, 57, 9, 8], ['b', -9, 146, 5.5, 13], ['b', 9, 146, 5.5, 13]] },
};

// What the Bulb 4.0's listed 65 mW/cm² at 15 cm would put on the skin in this many minutes.
// A reference figure only: it is for the centre of the beam, and not measured per mode.
export const specDose = (min) => Math.round(0.065 * min * 60 * 10) / 10;

// Indexed by Date.getDay(). Each step: [spot, minutes, flags].
// neck = the front-of-neck session that alternates Mon/Thu; side = Thursday's alternating cheek.
const WEEK = [
  { title: 'Rest', tag: 'Photoreceptor reset day', steps: [['footL', 5, { opt: 1 }], ['footR', 5, { opt: 1 }]] },
  { title: 'Face / Chest / Neck', tag: 'High stimulation day', steps: [['face', 8], ['cheekL', 4], ['cheekR', 4], ['neckF', 5, { neck: 1 }], ['chestL', 5], ['chestR', 5]] },
  { title: 'Belly / Pelvic / Calves', tag: 'Core & circulation', steps: [['bellyTop', 8], ['bellyBottom', 6], ['pelvic', 5], ['calfL', 5], ['calfR', 5]] },
  { title: 'Scalp / Neck', tag: 'Nerve + hair focus', steps: [['crown', 8], ['neckB', 5], ['face', 5, { opt: 1, note: 'Only if your skin feels fine after Monday.' }]] },
  { title: 'Shoulders / Face', tag: 'Mid-week face rotation', steps: [['shoulderL', 5], ['shoulderR', 5], ['neckF', 5, { neck: 1 }], ['forehead', 5], ['cheekL', 4, { side: 'L' }], ['cheekR', 4, { side: 'R' }]] },
  { title: 'Belly / Pelvic / Scalp', tag: 'Recovery boost', steps: [['bellyBottom', 6], ['pelvic', 5], ['crown', 6], ['extra', 5, { opt: 1 }]] },
  { title: 'Chest / Shoulders / Calves', tag: 'Peripheral focus', steps: [['chestL', 5], ['chestR', 5], ['shoulderL', 5], ['shoulderR', 5], ['calfL', 5], ['calfR', 5]] },
];

export const key = (d) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
export const fromKey = (k) => new Date(k + 'T12:00');

// Weeks counted from a Monday, so the two alternations flip when a new week starts.
const weekNo = (d) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5 + 3) / 7);
export const neckOnMonday = (d, cfg) => (weekNo(d) % 2 === 0) !== !!cfg.neckFlip;
export const thuSide = (d, cfg) => ((weekNo(d) % 2 === 0) !== !!cfg.sideFlip ? 'L' : 'R');

// Everything scheduled for one date, with Ali's own edits laid over the defaults.
export function plan(date, cfg) {
  const dow = date.getDay();
  const day = WEEK[dow];
  const steps = day.steps
    .filter(([, , f = {}]) => (!f.neck || neckOnMonday(date, cfg) === (dow === 1)) && (!f.side || f.side === thuSide(date, cfg)))
    .map(([id, min, f = {}]) => {
      const spot = { ...SPOTS[id], ...cfg.spots[id] };
      if (!(spot.mode in MODES)) spot.mode = 'both'; // an old NIR-only choice
      return { id, ...spot, min: +cfg.mins[`${dow}.${id}`] || min, base: min, opt: !!f.opt, note: f.note || '', cm: spot.cm || cfg.lights[spot.light]?.cm || '' };
    });
  const req = steps.filter((s) => !s.opt);
  return { dow, title: day.title, tag: day.tag, steps, req, reqMin: req.reduce((n, s) => n + s.min, 0) };
}

// localStorage fallback only exists so popup.html can be opened outside the extension.
const area = globalThis.chrome?.storage?.local;
const readLocal = () => JSON.parse(localStorage.mito || '{}');

export async function save(patch) {
  if (area) return area.set(patch);
  localStorage.mito = JSON.stringify({ ...readLocal(), ...patch });
}

export async function load() {
  const raw = area ? await area.get(['cfg', 'hist', 'run', 'since']) : readLocal();
  const day = key(new Date());
  if (!raw.since) await save({ since: day });
  const cfg = { ...DEFAULT_CFG, ...raw.cfg, lights: { a: { ...DEFAULT_CFG.lights.a, ...raw.cfg?.lights?.a }, b: { ...DEFAULT_CFG.lights.b, ...raw.cfg?.lights?.b } } };
  const hist = raw.hist || {}; // per day: { done: [spot], skip: [spot], got, req, min }
  // A timer left over from another day is dead.
  const run = raw.run?.day === day ? raw.run : null;
  return { cfg, day, hist, run, since: raw.since || day, done: hist[day]?.done || [], skip: hist[day]?.skip || [] };
}

export const saveCfg = async (patch) => save({ cfg: { ...(await load()).cfg, ...patch } });

// state: 'done', 'skip', or null to clear. Each day keeps its own score for the calendar.
export async function mark(id, state) {
  const s = await load();
  const p = plan(new Date(), s.cfg);
  const done = s.done.filter((x) => x !== id), skip = s.skip.filter((x) => x !== id);
  if (state === 'done') done.push(id);
  if (state === 'skip') skip.push(id);
  const hit = p.steps.filter((x) => done.includes(x.id));
  const entry = { done, skip, req: p.req.length, got: hit.filter((x) => !x.opt).length, min: hit.reduce((n, x) => n + x.min, 0) };
  const hist = { ...s.hist, [s.day]: entry };
  for (const k of Object.keys(hist).sort().slice(0, -400)) delete hist[k];
  await save({ hist });
}

export const resetDay = async () => {
  const s = await load();
  const hist = { ...s.hist };
  delete hist[s.day];
  await stopRun();
  await save({ hist });
};

// The timer lives in storage with an alarm behind it, so it keeps going when the popup closes.
export async function startRun(id) {
  const s = await load();
  const step = plan(new Date(), s.cfg).steps.find((x) => x.id === id);
  if (!step) return;
  const end = Date.now() + step.min * 60000;
  await save({ run: { id, day: s.day, end } });
  globalThis.chrome?.alarms?.create('timer', { when: end });
}

export async function stopRun() {
  await save({ run: null });
  globalThis.chrome?.alarms?.clear('timer');
}

// The timer ran out: check the spot off and say what comes next. Safe to call twice.
export async function completeRun() {
  const s = await load();
  if (!s.run || s.run.end > Date.now() + 500) return null;
  const id = s.run.id;
  await stopRun();
  await mark(id, 'done');
  const steps = plan(new Date(), s.cfg).steps;
  const left = (x) => x.id !== id && !s.done.includes(x.id) && !s.skip.includes(x.id);
  return { step: steps.find((x) => x.id === id), next: steps.find((x) => left(x) && !x.opt) || null };
}

export const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

// Lines for the quiet moments. Kept to what the maker's guidance and the evidence support.
export const TIPS = [
  'The evidence is moderate for facial skin and for hair with dedicated red devices, weak for muscle recovery, and absent for belly, pelvis, back of neck and feet.',
  'No study sets a session length for this bulb on any spot. Your 4 to 8 minute timers are your routine: not proven too short, not proven too long.',
  'More is not better. Light therapy has a sweet spot, so there is no reason to stretch a pass just to hit 10 minutes.',
  'Consistency over weeks does the work. Skin trials judged results at 8 to 15 weeks, hair trials at 16.',
  'The same patch of skin can sit under more than one timer, and two lamps on one patch add up. Count the overlap, especially on the face.',
  'Distance changes the dose. Measure lamp to skin once and keep it the same every time.',
  'Bare, clean skin. Clothes block much of both red and NIR.',
  'Sunday off is a sensible habit, not a proven requirement. Nothing shows the body needs a reset day.',
  'Switch the mounted light off before you look back at your screens.',
  'Changing mode on the Bulb 4.0: switch it off and on again within 10 seconds. It cycles Red + NIR, then Red, then NIR, and remembers a mode once it has run for 10 seconds.',
  'There is no proven best time of day. MITO LIGHT suggests avoiding intense red light 2 to 3 hours before sleep; the sleep research itself is thin either way.',
  'MITO LIGHT\'s range for the Bulb 4.0 is 15 to 50 cm, 10 to 20 minutes per area, and at most 30 minutes on one area in a day.',
  'The listed 65 mW/cm² at 15 cm is for the centre of the beam and is not broken out by mode. Treat any dose number as a rough reference.',
  'Stop if an area gets painfully hot or irritated. Check with a clinician or pharmacist first if you take photosensitising medication.',
  'Do not treat a known or suspected cancer site, or an area with a suspected blood clot.',
];
export const tip = (seed) => {
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TIPS[h % TIPS.length];
};
