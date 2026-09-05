# Cutoff Explorer — Adding New States (Handoff)

## Current status (2026-08-29)
Uttarakhand AIQ data is committed to `main` (commit `9517b56`) but **not yet confirmed live** on asmicareer.com — deploy pipeline was broken and got fixed step by step this session (see "Cloudflare Pages config" below). Last check still showed the pre-fix build (`sRIg4OkqcGwH0xG5lt0JK`). Verify live before trusting anything is deployed:
```bash
curl -s "https://asmicareer.com/data/cutoffs/OPEN/2026/Uttarakhand/AIQ.json?_=$(date +%s)"
```
Should return JSON (200), not the site's 404 HTML.

## Where data lives (no database)
Static JSON files in the repo, `main` branch:
`nextjs-sandbox/public/data/cutoffs/{counselling}/{year}/{state_or_type}/{quota_or_category}.json`

Frontend fetch logic (two independent copies — **always edit both**):
- `nextjs-sandbox/public/cutoff_explorer.html`
- `nextjs-sandbox/public/counsellor/index.html`

## Adding a new state to OPEN counselling (the "state quota" bucket)

1. **Check `OPEN_STATE_CATS`** in both HTML files (~line 328-346) — this hardcoded map lists every state's quota keys, e.g. `'Uttarakhand': ['MQ', 'NRI', 'AIQ']`. Add your new state/quota here. **Do not reuse an existing state's key for a different quota meaning** — if a state already has `MQ`/`NRI`, a new quota type needs its own distinct key (like `AIQ` here), not overloading an existing one.
2. **Check `OPEN_STATES`** array (~line 323-327) — add the state name (space-separated, not underscore) if it's a brand-new state not already listed.
3. **File naming**: folder = state name with spaces replaced by `_` (e.g. `Uttar_Pradesh`). Uttarakhand has no space, so folder = `Uttarakhand`.
4. **JSON shape** — copy the exact shape from an existing file, e.g. `nextjs-sandbox/public/data/cutoffs/OPEN/2025/Uttarakhand/MQ.json`:
   ```json
   {
     "counselling": "OPEN", "state": "<State Name>", "year": 2026, "quota": "<QUOTA_KEY>",
     "colleges": [{
       "code": null, "name": "...", "establishment": 1995, "fees": "2400000", "type": "Private",
       "rounds": { "Round 1": { "Intake": 107, "AIR": 233456, "SML": 1184 } }
     }]
   }
   ```
   Also write an `all.json` (array-wrapped, same shape) alongside it — matches the existing 2025 folder convention, harmless if unused by `loadData()` today.
5. **No overlap rule**: before adding a state, check both `OPEN_STATES` and `OPEN_STATE_CATS` don't already have it under a different spelling/key. Grep first:
   ```bash
   grep -n "YourStateName" nextjs-sandbox/public/cutoff_explorer.html nextjs-sandbox/public/counsellor/index.html
   ```

## Other counsellings (MCC / MH) — different path shapes
See `CUTOFF_EXPLORER_DATA_CONTRACT.md` (repo root) for the full contract — MCC uses `institution_type`/`category`, MH uses `quota_type`/`category`/`sub_type`. Don't force a new state into the OPEN shape if it's actually MCC/MH data.

## Cloudflare Pages config (fixed this session — don't re-break it)
Project: `asmicareer-nextjs` in Cloudflare dashboard (Workers & Pages).
- **Root directory**: `nextjs-sandbox` (NOT blank, NOT `main` — a real bug hit twice this session, the field got typo'd to the branch name)
- **Build command**: `npm run build` (NOT `next build` — bare `next` isn't on PATH; NOT `... && wrangler pages deploy ...` — that's redundant, Pages auto-deploys the build output and the wrangler step needs an API token that isn't set)
- **Build output directory**: locked to `nextjs-sandbox/wrangler.toml`'s `pages_build_output_dir = "out"` — don't edit this field directly, it's greyed out on purpose
- **Branch control → Production branch**: must be `main` (was `nextjs` — an old, structurally different codebase with no `nextjs-sandbox/` prefix at all; confirmed with the user that `main` is the correct/current app)

**Known gotcha**: changing Branch control alone does NOT trigger a new build. You must push a new commit (or manually create/retry a deployment) AFTER the branch setting is saved — and a *retried* old deployment keeps its original Preview/Production tag from when it was first queued, so retry doesn't help if the branch was wrong at queue time. Push fresh to get a correctly-tagged build.

## Pipeline source (if re-deriving cutoff data from a PDF for a new state)
`C:\Users\devan\asmi-cutoff-engine\app\core\engine.py` has per-state PDF parsers (AYUSH, Rajasthan, MCC patterns) to mirror. Key lessons baked into that file's comments:
- Position-based (word x0/top) extraction beats line-regex when PDF columns wrap unpredictably
- `page.close()` after each page — real OOM risk on large PDFs otherwise
- Verify against real PDF samples before trusting a parser (dump matched rows, spot-check known colleges)
- Dedup/group by the FULL scope-relevant key tuple, not a partial one (e.g. category+college, not just college)
