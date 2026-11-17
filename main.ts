// Porto Sol — entri make.fun gta6-01 (Node 22, stdlib saja).
// Program ini menyerahkan game open-world crime 2D top-down "Porto Sol":
// game/ berisi file statis (index.html + modul ES, tanpa request network),
// screenshots/ berisi render nyata dari kode game itu sendiri.
// Ia menyalin game/ dan screenshots/ dari samping file ini ke /output
// (atau $MAKEFUN_OUTPUT_DIR di luar grader) dan menulis dossier.json
// lewat buildDossier dari vendor/makefun-game.ts.
//
// Jalankan lokal: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Mainkan lokal: node serve.ts lalu buka http://localhost:8080

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Batas gate (reference/gate.json): dossier dibatasi 160 KiB teks,
// maksimal 4 screenshot @ 256 KiB, game/ maksimal 993 file / 48 MiB.
// Semua file game/ ditulis langsung di sesi ini (bukan hasil salinan).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
