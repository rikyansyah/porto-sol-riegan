# porto-sol-riegan

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/rikyansyah/porto-sol-riegan/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/rikyansyah/porto-sol-riegan/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Porto Sol** is an original 2D top-down open-world crime game set in a sunny
harbour city of palm trees, market stalls, beaches and one very tempting bank.
You are a newcomer with empty pockets and a fixer named Mara who always has
work: steal a yellow sedan for Rico, survive a raid at the market, run three
packages across town, and finally hold the Bank Sol vault long enough to fill
a bag — then outrun a four-star response all the way to the harbour drop.

Everything in Porto Sol is original: the city, its people, its names and its
story were written for this game. It runs entirely in the browser with plain
canvas and ES modules — no libraries, no build step, no network requests.

## What's in the city

- A 3200×2400 world on a 400-unit road grid: warm tropical blocks, sidewalks,
  palms, a park hideout, a market square, a harbour with boats and crates,
  beaches and water along the south and east edges, and the signed Bank Sol.
- Walking and driving: steal any parked or moving car (E), with simple
  acceleration, braking and steering physics and a smooth follow camera.
- Living traffic: AI cars cruise the grid and brake for obstacles, while
  pedestrians stroll the sidewalks, panic at gunfire and flee danger.
- A 0–5 star wanted system: stealing in front of witnesses, collisions,
  shooting and robbing all raise heat; patrol cars and officers give chase,
  pin you for a BUSTED, and lose you when you hide far away long enough.
- Combat: mouse-aimed pistol with a limited magazine and reload (R), a
  close-range punch (Space), muzzle flash, tracers and cash drops.
- Four story missions from Mara with map markers, a live objective line,
  a minimap, HP/money/wanted HUD, pause, BUSTED/WASTED screens and an ending
  screen after mission 4 — then free roam.
- Autosave to `localStorage` every 10 seconds and on mission completion.
- A small WebAudio synth for shots, crashes, pickups, sirens and mission
  stingers, plus deterministic `?seed=` / `?shot=` scenes for screenshots.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

Controls: **WASD / arrows** move and drive · **E** enter/leave a car ·
**Enter** start, and start a mission at Mara's marker · **mouse** aim,
**click** shoot · **Space** punch · **R** reload · **P / Esc** pause.

## Build the submission output

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `game/` and `screenshots/` into `out/` and writes the
`dossier.json` summary there with the vendored make.fun library.

Entered on [make.fun](https://make.fun/?ref=vrsa6rr4&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards
