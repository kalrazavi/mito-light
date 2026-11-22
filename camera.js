// Copyright (c) 2026 Ali Razavi. All rights reserved. Owned and controlled solely by Ali Razavi: no licence check, no remote control, no backdoor. Terms: see the LICENSE file.
// Position check for the face passes. Watches the webcam, works out how far the face is and whether
// it is centred, and says which way to move. Everything runs on this machine.

import { FaceDetector, FilesetResolver } from './vision/vision_bundle.mjs';
import { load, plan, saveCfg, startRun, stopRun, clock, REF } from './core.js';

const $ = (id) => document.getElementById(id);
const id = new URLSearchParams(location.search).get('spot');

// Until calibrated: a face box about 15 cm tall seen through a typical 45° webcam.
const GUESS_K = 0.15 / (2 * Math.tan((45 * Math.PI) / 360)) * 100; // cm × (box height / frame height)
const OFF = 0.13; // how far off centre (fraction of the frame) before it asks you to move

let step = null, k = null, range = REF.cm, run = null;
let h = 0, cx = 0.5, cy = 0.5; // smoothed face box height and centre, as fractions of the frame
let seen = 0; // when a face was last found

async function refresh() {
  const st = await load();
  step = plan(new Date(), st.cfg).steps.find((s) => s.id === id) || null;
  k = st.cfg.cam?.k || null;
  run = st.run;
  // A distance set for the spot (or its light) becomes the target, give or take 15%.
  const cm = +step?.cm;
  range = cm ? [Math.round(cm * 0.85), Math.round(cm * 1.15)] : REF.cm;
  $('spot').textContent = step ? step.name : 'Position check';
  $('target').textContent = `target ${range[0]}–${range[1]} cm${k ? '' : ' · not calibrated'}`;
  $('calstate').textContent = k ? 'Calibrated.' : 'Not calibrated yet, so the distance is a rough guess.';
  $('calib').open ||= !k;
  drawButton();
}

function drawButton() {
  const b = $('start');
  const mine = run && run.id === id;
  b.classList.toggle('off', !step);
  b.classList.toggle('running', !!mine);
  b.classList.toggle('primary', !mine);
  if (!step) return;
  b.textContent = mine ? `${clock(Math.max(0, Math.ceil((run.end - Date.now()) / 1000)))} · stop ✕` : `▶ Start ${clock(step.min * 60)} timer`;
}
$('start').onclick = async () => { await (run?.id === id ? stopRun() : startRun(id)); refresh(); };
setInterval(drawButton, 500);

// ---- what to say ----

let last = '', lastAt = 0, goodSince = 0;
function say(text, tone) {
  $('say').textContent = text;
  $('say').className = tone;
  $('stage').className = tone;
  // Speak when the advice changes, and repeat a correction every 6 seconds while it still applies.
  const now = Date.now();
  if (!$('voice').checked || (text === last && (tone !== 'bad' || now - lastAt < 6000))) return;
  if (text !== last && now - lastAt < 1200) return; // let a wobble settle before talking over it
  last = text;
  lastAt = now;
  speechSynthesis.cancel();
  speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(text), { rate: 1.05 }));
}

function advise() {
  if (Date.now() - seen > 1500) {
    $('cm').textContent = '–';
    goodSince = 0;
    // With the goggles on, or turned for a cheek pass, the face can drop out. Say it once, not on repeat.
    return say('I can\'t see your face', '');
  }
  const cm = (k || GUESS_K) / h;
  $('cm').textContent = `${k ? '' : '~'}${Math.round(cm)} cm`;
  let text = '';
  if (cm < range[0]) text = cm < REF.cm[0] ? 'Too close. Move back' : 'Move back a little';
  else if (cm > range[1]) text = cm > range[1] * 1.3 ? 'Too far. Move closer' : 'Move a little closer';
  // The camera sees you facing it, so the left of its picture is your right.
  else if (cx < 0.5 - OFF) text = 'Move left';
  else if (cx > 0.5 + OFF) text = 'Move right';
  else if (cy < 0.5 - OFF) text = 'Move down';
  else if (cy > 0.5 + OFF) text = 'Move up';
  if (text) { goodSince = 0; return say(text, 'bad'); }
  goodSince ||= Date.now();
  if (Date.now() - goodSince > 1000) say('Good. Hold there', 'good');
}

// ---- camera and detector ----

async function main() {
  await refresh();
  const video = $('video');
  try {
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
    await video.play();
  } catch (e) {
    return say(e.name === 'NotAllowedError' ? 'Camera access was blocked' : 'No camera found', 'bad');
  }
  let detector;
  try {
    const files = await FilesetResolver.forVisionTasks('./vision/wasm');
    detector = await FaceDetector.createFromOptions(files, {
      baseOptions: { modelAssetPath: './vision/face.tflite' },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
    });
  } catch (e) {
    console.error(e);
    return say('The face tracker failed to load', 'bad');
  }

  const loop = () => {
    if (video.readyState >= 2) {
      const face = detector.detectForVideo(video, performance.now()).detections
        .sort((a, b) => b.boundingBox.height - a.boundingBox.height)[0]; // nearest face wins
      if (face) {
        const b = face.boundingBox, W = video.videoWidth, H = video.videoHeight;
        const a = Date.now() - seen > 1500 ? 1 : 0.25; // smooth, but snap when the face reappears
        h += (b.height / H - h) * a;
        cx += ((b.originX + b.width / 2) / W - cx) * a;
        cy += ((b.originY + b.height / 2) / H - cy) * a;
        seen = Date.now();
      }
      advise();
    }
    setTimeout(loop, 100);
  };
  loop();
}

$('setcal').onclick = async () => {
  const d = +$('known').value;
  if (!(d > 0) || Date.now() - seen > 1500) return ($('calstate').textContent = 'I need to see your face first.');
  await saveCfg({ cam: { k: d * h } });
  $('calib').open = false;
  refresh();
};

globalThis.chrome?.storage?.onChanged.addListener(refresh);
main();
