// One-off build script: generates nextjs-sandbox/public/data/closing_ranks_2025.json
// from the /data/cutoffs/{MCC,MH,OPEN}/2025 source files.
// Run: node scripts/build_closing_ranks.js

const fs = require('fs');
const path = require('path');

const CUTOFFS_ROOT = path.join(__dirname, '..', 'nextjs-sandbox', 'public', 'data', 'cutoffs');
const OUT_PATH = path.join(__dirname, '..', 'nextjs-sandbox', 'public', 'data', 'closing_ranks_2025.json');

let rawRecordsIn = 0;

// Reused verbatim from counsellor/index.html's isStray detection logic.
function isStray(roundName) {
  const rl = roundName.toLowerCase();
  return rl.includes('stray') || rl.includes('special') || rl.includes('additional') || rl.includes('extended');
}

// Closing rank = MAX(AIR) across Round 1/2/3 (plus "Mop Up Round", which some
// states — e.g. Kerala, Karnataka — use as a genuine counselling round rather
// than Round 3) only, skipping null/missing. Genuine Stray/Special rounds are
// still excluded. Returns null if no round contributed (all null/missing).
const COUNTABLE_ROUND_NAMES = ['Round 1', 'Round 2', 'Round 3', 'Mop Up Round'];
function closingRankFromRounds(rounds) {
  if (!rounds) return null;
  let max = null;
  for (const roundName of Object.keys(rounds)) {
    if (isStray(roundName)) continue;
    if (!COUNTABLE_ROUND_NAMES.includes(roundName)) continue;
    const air = rounds[roundName] && rounds[roundName].AIR;
    if (air == null || air === '') continue;
    const val = parseInt(air, 10);
    if (isNaN(val)) continue;
    if (max === null || val > max) max = val;
  }
  return max;
}

// Fallback tier: some colleges have zero seats filled in Round 1-3 (or Mop Up)
// but genuinely got their first/only allotments in a Stray round (e.g. a
// college added mid-counselling). Rather than dropping such records entirely,
// use MAX(AIR) across Stray rounds ONLY when R1-3/Mop Up are completely empty.
// If R1-3/Mop Up has ANY valid data, Stray is ignored — this fallback never
// overrides or blends with real primary-round data.
function closingRankWithStrayFallback(rounds) {
  const primary = closingRankFromRounds(rounds);
  if (primary !== null) return primary;
  if (!rounds) return null;

  let max = null;
  for (const roundName of Object.keys(rounds)) {
    if (!isStray(roundName)) continue;
    const air = rounds[roundName] && rounds[roundName].AIR;
    if (air == null || air === '') continue;
    const val = parseInt(air, 10);
    if (isNaN(val)) continue;
    if (max === null || val > max) max = val;
  }
  return max;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// ── MCC ──────────────────────────────────────────────────────────
function buildMCC() {
  const out = [];
  const instTypesDir = path.join(CUTOFFS_ROOT, 'MCC', '2025');
  const instTypes = fs.readdirSync(instTypesDir).filter(f =>
    fs.statSync(path.join(instTypesDir, f)).isDirectory()
  );

  instTypes.forEach(instType => {
    const instDir = path.join(instTypesDir, instType);
    const categoryFiles = fs.readdirSync(instDir).filter(f => f.endsWith('.json') && f !== 'all.json');

    categoryFiles.forEach(file => {
      const category = file.replace(/\.json$/, '');
      const data = readJson(path.join(instDir, file));
      const colleges = data.colleges || [];
      rawRecordsIn += colleges.length;

      colleges.forEach(college => {
        const closing_rank = closingRankWithStrayFallback(college.rounds);
        if (closing_rank === null) return; // all rounds null — no closing rank exists

        out.push({
          code: college.code || null,
          name: college.name || null,
          state: college.state || null,
          type: college.type || null,
          fees: college.fees || null,
          institution_type: instType,
          category,
          closing_rank,
        });
      });
    });
  });

  return out;
}

// Records to exclude from the Stray-round fallback (use R1-3/Mop-Up only,
// drop the record if those are null — same as everywhere else) even though
// a Stray round has data for them. Matched by exact college name + category.
const MH_STRAY_FALLBACK_EXCLUDE = [
  { name: 'Ashwini Rural Medical College, Solapur', category: 'VJ' },
];

// ── MH ───────────────────────────────────────────────────────────
function buildMH() {
  const out = [];
  const quotasDir = path.join(CUTOFFS_ROOT, 'MH', '2025');
  const quotas = fs.readdirSync(quotasDir).filter(f =>
    fs.statSync(path.join(quotasDir, f)).isDirectory()
  );

  quotas.forEach(quota => {
    const quotaDir = path.join(quotasDir, quota);
    const categories = fs.readdirSync(quotaDir).filter(f =>
      fs.statSync(path.join(quotaDir, f)).isDirectory()
    );

    categories.forEach(category => {
      const catDir = path.join(quotaDir, category);
      const subTypeFiles = fs.readdirSync(catDir).filter(f => f.endsWith('.json'));

      // MH cutoff files are split by sub-type (GENERAL/FEMALE/HA_GENERAL/...) — the
      // requested output has no sub-type dimension, so collapse to one row per
      // college+category using the GENERAL sub-type where available, same
      // fallback heuristic already used in student-explorer/index.html's
      // fetchMHPool(): prefer GENERAL, else the first sub-type present.
      const subTypeNames = subTypeFiles.map(f => f.replace(/\.json$/, ''));
      const chosenSubType = subTypeNames.includes('GENERAL') ? 'GENERAL' : subTypeNames[0];
      if (!chosenSubType) return;

      const data = readJson(path.join(catDir, chosenSubType + '.json'));
      const colleges = data.colleges || [];
      rawRecordsIn += colleges.length;

      colleges.forEach(college => {
        const strayExcluded = MH_STRAY_FALLBACK_EXCLUDE.some(
          x => x.name === college.name && x.category === category
        );
        const closing_rank = strayExcluded
          ? closingRankFromRounds(college.rounds)
          : closingRankWithStrayFallback(college.rounds);
        if (closing_rank === null) return;

        out.push({
          code: college.code || null,
          name: college.name || null,
          state: 'Maharashtra',
          type: quota === 'GOVT_MBBS' ? 'Govt' : 'Private',
          fees: college.fees || null,
          quota,
          category,
          closing_rank,
        });
      });
    });
  });

  return out;
}

// ── OPEN ─────────────────────────────────────────────────────────
// Some states' all.json bundles multiple quota blocks (MQ/NRI/OTH/RC8/...)
// that shouldn't all be included — only one quota is the real, intended
// admission pool for that state. Extend this map if similar issues surface
// for other states. Quota label strings vary per state (MQ/COUNSELOR/MGT),
// so this is an explicit per-state allow-list rather than one hardcoded rule.
const OPEN_ALLOWED_QUOTA = {
  Karnataka: ['MQ'],
  Telangana: ['MQ'],
  Andhra_Pradesh: ['COUNSELOR'],
  Bihar: ['MGT'],
  Pondicherry: ['MQ'],
  Uttarakhand: ['MQ'],
};

// Colleges to exclude entirely from the OPEN bucket, keyed by state folder,
// matched by exact college name.
const OPEN_EXCLUDE_COLLEGES = {
  Pondicherry: ['Indira Gandhi Medical College and Research Institute, Puducherry (Government College)'],
};

// States where the Stray-round fallback should NOT apply — use R1-3/Mop-Up
// only, drop the record if those are null, same as everywhere else.
const OPEN_STRAY_FALLBACK_DISABLED_STATES = ['West_Bengal'];

function buildOPEN() {
  const out = [];
  const statesDir = path.join(CUTOFFS_ROOT, 'OPEN', '2025');
  const states = fs.readdirSync(statesDir).filter(f =>
    fs.statSync(path.join(statesDir, f)).isDirectory()
  );

  states.forEach(stateFolder => {
    const allJsonPath = path.join(statesDir, stateFolder, 'all.json');
    if (!fs.existsSync(allJsonPath)) return;

    const allowedQuotas = OPEN_ALLOWED_QUOTA[stateFolder] || null;
    const excludedNames = OPEN_EXCLUDE_COLLEGES[stateFolder] || null;
    const strayFallbackDisabled = OPEN_STRAY_FALLBACK_DISABLED_STATES.includes(stateFolder);
    const closingRankForOpen = strayFallbackDisabled ? closingRankFromRounds : closingRankWithStrayFallback;

    const data = readJson(allJsonPath);
    const blocks = Array.isArray(data) ? data : [data];

    blocks.forEach(block => {
      if (allowedQuotas && !allowedQuotas.includes(block.quota)) return;

      const colleges = (block.colleges || []).filter(college =>
        !excludedNames || !excludedNames.includes(college.name)
      );
      rawRecordsIn += colleges.length;

      colleges.forEach(college => {
        if (college.categories) {
          // Himachal Pradesh-style nested shape: categories[catName][round].AIR
          Object.keys(college.categories).forEach(catName => {
            const closing_rank = closingRankForOpen(college.categories[catName]);
            if (closing_rank === null) return;

            out.push({
              code: college.code || null,
              name: college.name || null,
              state: block.state || stateFolder.replace(/_/g, ' '),
              type: college.type || null,
              fees: college.fees || null,
              quota: block.quota || null,
              category: catName,
              closing_rank,
            });
          });
        } else {
          // Standard flat shape: rounds[round].AIR, no category split
          const closing_rank = closingRankForOpen(college.rounds);
          if (closing_rank === null) return;

          out.push({
            code: college.code || null,
            name: college.name || null,
            state: college.state || block.state || stateFolder.replace(/_/g, ' '),
            type: college.type || null,
            fees: college.fees || null,
            quota: block.quota || null,
            category: null,
            closing_rank,
          });
        }
      });
    });
  });

  return out;
}

const result = {
  MCC: buildMCC(),
  MH: buildMH(),
  OPEN: buildOPEN(),
};

const totalOut = result.MCC.length + result.MH.length + result.OPEN.length;

fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));

console.log('Raw records read (colleges arrays, pre-collapse):', rawRecordsIn);
console.log('MCC output records:', result.MCC.length);
console.log('MH output records:', result.MH.length);
console.log('OPEN output records:', result.OPEN.length);
console.log('Total output records:', totalOut);
console.log('Written to:', OUT_PATH);
