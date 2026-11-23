# Changelog

Every version of Mito Light and every bug I found and had fixed. Nothing here worked perfectly out of the box: I used it daily, found what was wrong, worked out what it should do instead, and had it fixed. Each fix lists what I noticed, why it happened, and what changed.

Dates are when the change went live. Commit IDs link each entry to the code.

---

## v1.1.1 · 22 Nov 2026 · Clean icon
`f4a4c16`, `b185706`

### Fixed
- **The extension icon showed a red "6" like unread notifications.**
  Noticed: a number on the icon although this extension should never nag me.
  Cause: the icon was built to show how many of today's spots were still open, which looked like six notifications.
  Fix: the count is gone. The icon only shows a mark while a timer is actually running.

### Added
- Ownership notice in the code and at the bottom of the popup.

## v1.1 · 21 Nov 2026 · Corrections before release
`404ae1b`

The first public version already carried my corrections from building it:

- **Some spots were set to near-infrared only.** I want red light on the skin as well, so no spot is ever NIR alone: every spot is red, or red plus NIR.
- **Distances and durations were guesses.** I had the numbers checked against the bulb maker's specs and a deep research pass on the studies, and every spot now carries an evidence label (moderate, weak or none) instead of overselling.
- **No way to check my position before starting a timer.** Added a webcam position check for face passes: it estimates how far my face is from the lamp and whether it is centred, and says "move closer", "move left" and so on. The face detection runs in the browser and installs nothing else on the computer.

## v1.0 · 21 Nov 2026 · First release
`404ae1b`, `433ee0e`

- Weekly red light routine: today's spots on a body map, a timer for each that keeps running when the popup is closed, a daily reminder and a year calendar with streaks.
