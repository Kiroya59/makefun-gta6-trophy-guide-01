// GTA VI trophy guide entry (Node 22, standard library only).
// The guide itself is app/ — plain static files a browser opens at app/index.html, fully offline:
// a checklist tracker with localStorage progress, filters, spoiler mode and export/import, a
// roadmap to the platinum, missable flags, and a guide with cited sources for all 55 trophies in
// app/data/trophies.json. This program hands the entry in: it copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json there with the vendored
// make.fun library, so the judge can read the screenshots, the first load, and the source.
//
// Run it locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide:  node serve.ts   (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly instead of handing in a broken entry: the guide must name all 55 official
// trophies, each with a non-blank guide, and screenshots/ must hold 3–4 images.
const trophies = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8')).trophies;
if (!Array.isArray(trophies) || trophies.length !== 55) {
  throw new Error(`expected 55 trophies, found ${Array.isArray(trophies) ? trophies.length : 'none'}`);
}
for (const t of trophies) {
  if (typeof t.name !== 'string' || !t.name || typeof t.guide !== 'string' || !t.guide.trim()) {
    throw new Error(`trophy ${JSON.stringify(t)} is missing a name or guide`);
  }
}
const shots = readdirSync(join(here, 'screenshots')).filter((f) => !f.startsWith('.'));
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3-4 screenshots, found ${shots.length}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
const grades = trophies.reduce((acc, t) => {
  acc[t.grade] = (acc[t.grade] ?? 0) + 1;
  return acc;
}, {});
console.log(
  `wrote ${out}: ${trophies.length} trophies ` +
    `(platinum ${grades.platinum ?? 0}, gold ${grades.gold ?? 0}, silver ${grades.silver ?? 0}, bronze ${grades.bronze ?? 0}), ` +
    `${shots.length} screenshots (${shots.join(', ')})`,
);
