# porto-sol-riegan

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/rikyansyah/porto-sol-riegan/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/rikyansyah/porto-sol-riegan/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

Porto Sol — a 2D top-down open-world crime game: an original harbour city to explore on foot and by car, traffic and pedestrians, cars you can steal, a wanted level with police chases, four story missions, combat, a HUD with minimap, start screen and saves. Everything in it is original: the city, characters, vehicles, names, story, art and sound. No Rockstar Games name, logo, character, map or asset.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. WASD to walk, E to enter a car, mouse to aim, click to shoot, P or Esc to pause, Enter to start a mission.

## Build the submission output

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `game/` and `screenshots/` to `out/` and writes `out/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.

---

Entered on [make.fun](https://make.fun/?ref=vrsa6rr4&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards

## Layout

- `main.ts` — the program: game + screenshots → dossier.
- `serve.ts` — tiny static server for playing locally (Node 22 stdlib only).
- `vendor/makefun-game.ts` — from the kit, unchanged.
- `game/` — the game: `index.html` + ES modules in `src/` (city, traffic, police, missions, combat, rendering, audio, saves). No network requests.
- `screenshots/` — four real renders from the game itself: title screen, police chase, mission on foot, final heist.
