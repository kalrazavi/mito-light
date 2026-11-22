// Copyright (c) 2026 Ali Razavi. All rights reserved. Owned and controlled solely by Ali Razavi: no licence check, no remote control, no backdoor. Terms: see the LICENSE file.
// The figure: front view on the left, back view on the right, with a glow on each of the day's spots.
// Left/right are the wearer's, so the left cheek sits on the right of the front view.

const CX = { f: 62, b: 178 };

const fig = (cx, label) => `
  <g class="fig">
    <path d="M${cx - 24} 48L${cx - 31} 100M${cx + 24} 48L${cx + 31} 100" class="arm"/>
    <path d="M${cx - 9} 104L${cx - 10} 172M${cx + 9} 104L${cx + 10} 172" class="leg"/>
    <path d="M${cx - 10} 179h.01M${cx + 10} 179h.01" class="foot"/>
    <rect x="${cx - 5}" y="33" width="10" height="12" rx="3"/>
    <path d="M${cx - 23} 42Q${cx} 37 ${cx + 23} 42L${cx + 17} 101Q${cx} 109 ${cx - 17} 101Z"/>
    <circle cx="${cx}" cy="22" r="13"/>
  </g>
  <text x="${cx}" y="197" class="lbl">${label}</text>`;

// steps: today's plan. state(step) -> 'done' | 'skip' | 'run' | ''. sel: the step on the card.
export function body(steps, state, sel) {
  const zones = steps.map((s) =>
    s.z.map(([v, dx, cy, rx, ry]) =>
      `<ellipse data-id="${s.id}" class="zone ${state(s)}${s.opt ? ' opt' : ''}${s.id === sel ? ' sel' : ''}" cx="${CX[v] + dx}" cy="${cy}" rx="${rx}" ry="${ry}"><title>${s.name} · ${s.min} min</title></ellipse>`
    ).join('')
  ).join('');
  return `<defs><filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
    ${fig(CX.f, 'front')}${fig(CX.b, 'back')}${zones}`;
}
