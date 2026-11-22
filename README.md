# Mito Light

**A red light routine that does not oversell itself.** A browser extension that runs a weekly red light therapy routine: today's spots on a body map, a timer for each, a check-off when it is done, and an honest label for how strong the evidence is.

## Why I built it

A routine with different body spots, minutes and distances on different days is easy to lose track of. And every guide I found stated the benefits with far more confidence than the studies behind them.

In my day job I work with AI agents, where a wrong answer costs more than an honest "I don't know". I wanted the same standard for my own routine: never claim more than can be backed up.

## What it does

- A weekly rotation: each day has its own spots and minutes, with a ceiling on total time.
- A body map showing today's spots, and a timer for each that keeps running when the window is closed.
- A daily reminder, and a year calendar with streaks.

## What makes it different

- **Evidence labels.** Every spot is marked moderate, weak or no evidence, with what the closest human studies actually used. Where nothing is established, it says so.
- **A position check that stays on your computer.** For face passes the webcam estimates how far your face is from the lamp and whether it is centred, and says which way to move. The face detection model runs in the browser. No video leaves the machine.

## How it works

The weekly plan picks today's spots, a background worker runs the timers and reminders, an on-device face detection model handles the position check, and check-offs are stored in the browser's local storage.

## Install

1. Download this repository (Code > Download ZIP) and unzip it.
2. Open `chrome://extensions` in Chrome, switch on **Developer mode**.
3. Click **Load unpacked** and choose the folder.

## Note

This is a personal routine tracker, not medical advice.

## How it was made

I am not a programmer. I designed the routine, set the rule that nothing is worded more strongly than the evidence, and tested it daily. An AI coding assistant (Claude Code) wrote the code.
