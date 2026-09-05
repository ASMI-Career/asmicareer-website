# Cutoff Explorer — Data Contract for Cutoff Engine Pipeline

Target spec for the `asmi-cutoff-engine` backend's translation layer (flat
`computed_results` rows → Explorer's static JSON files). Every shape below
was read directly from real committed files in `asmicareer-website` on
2026-08-22 — nothing here is inferred from field names alone.

Consumer: `nextjs-sandbox/public/cutoff_explorer.html` and
`nextjs-sandbox/public/counsellor/index.html` (two independent copies of
the same fetch logic — see Known Issues at the end).

---

## 1. Path convention

Base: `nextjs-sandbox/public/data/cutoffs/{counselling}/{year}/...`

`{year}` is now a real dimension (Phase 1 shipped 2026-08-22) — write to
`2026` going forward, never overwrite `2025`.

| Counselling | Path pattern | Example |
|---|---|---|
| MCC | `MCC/{year}/{institution_type}/{category}.json` | `MCC/2026/GOVT_MBBS/OPEN.json` |
| OPEN (states) | `OPEN/{year}/{state_folder}/{category_or_quota}.json` | `OPEN/2026/Karnataka/MQ.json` |
| MH | `MH/{year}/{quota_type}/{category}/{sub_type}.json` | `MH/2026/GOVT_MBBS/SC/FEMALE.json` |

- `{state_folder}`: state name with spaces replaced by underscores
  (`Himachal_Pradesh`, `Andhra_Pradesh`).
- One file per leaf combination. Frontend fetches exactly one file per
  page state — never assume it reads a directory listing.
- An `all.json` convention also exists per state/inst-type in some
  folders (aggregate of all categories) — confirm with frontend code
  before assuming the pipeline must also produce these; not required by
  `loadData()` today (it always requests a specific category file).

## 2. Base record shape (MCC / OPEN, standard case)

```json
{
  "counselling": "MCC",
  "institution_type": "GOVT_MBBS",
  "year": 2025,
  "category": "OPEN",
  "colleges": [
    {
      "code": "200219",
      "name": "Grant Medical College, Mumbai",
      "establishment": 1845,
      "fees": "1,25,700",
      "type": "Govt",
      "rounds": {
        "Round 1": { "Intake": 16, "AIR": 2368, "AIR_PWD": 181340 },
        "Round 2": { "Intake": 11, "AIR": 4354, "AIR_PWD": 204368 },
        "Stray Vacancy Round": { "Intake": 1, "AIR": 10798, "AIR_PWD": null }
      }
    }
  ]
}
```

For `OPEN` counselling, top-level key is `"state"` instead of
`"institution_type"`, and `"quota"` instead of `"category"`:

```json
{ "counselling": "OPEN", "state": "Karnataka", "year": 2025, "quota": "MQ", "colleges": [...] }
```

For `MH` counselling, top-level keys are `"quota_type"`, `"category"`,
`"sub_type"`:

```json
{ "counselling": "MH", "year": 2025, "quota_type": "PRIVATE_MBBS", "category": "VJ", "sub_type": "GENERAL", "colleges": [...] }
```

### Field names — exact, case-sensitive

| Field | Where | Notes |
|---|---|---|
| `code` | college | string usually, sometimes numeric (MH), can be `null` (seen in HP) |
| `name` | college | string |
| `establishment` | college | number (year founded) |
| `fees` | college | **string**, various formats per source (`"1,25,700"`, `"88,714"`, `"11,100/-"`, `"1200117"` unformatted) — do not reformat, carry through as-authored; see §4 |
| `type` | college | `"Govt"` / `"Private"` / `"Deemed"` — MCC/OPEN only, absent on MH reserved-category files seen |
| `total_intake` | college | Kerala MQ only — see §3 |
| `rounds` | college | object keyed by round name — see below (HP uses `categories` instead, see §3) |
| `Intake` | round | number, or `null`/`"-"` when round didn't run — **can also appear as a string in malformed source rows** (see §5, MH data-quality note) |
| `AIR` | round | number = closing rank, or `null` |
| `SML` | round | present on OPEN/MH files; **absent entirely on MCC and Karnataka** — do not emit `"SML": null`, omit the key |
| `AIR_PWD` | round | MCC only, in place of `SML` |
| `CSML` | round | MH reserved-category (non-GENERAL) files only, in addition to `SML` — value is a **string** like `"DT-VJ(A)-160"`, not numeric |
| `Score` | round | seen on some MH reserved-category files, absent elsewhere — see §5 before deciding whether to emit |

## 3. Confirmed per-state/counselling exceptions

**Karnataka (OPEN)** — no `SML` key anywhere in the file, MCC-style
`AIR`+`Intake` only, but no `AIR_PWD` either (unlike MCC). Round names
include `Stray Round`, `Stray Round 2`, `Stray Round 3`.

**Kerala MQ/NRI (OPEN)** — college object has a college-level
`"total_intake"` field; **rounds do not carry per-round `Intake`** at
all, only `AIR` + `SML`. If the pipeline computes per-round intake for
Kerala, do not force it into this shape — put the round-level intake
figure at `total_intake` (summed) or omit if not computed.

**Himachal Pradesh (OPEN)** — two structural differences, not just a
missing field:
1. **The file's top level is a JSON array, not an object** — 
   `[{ counselling, state, year, quota, colleges: [...] }]` (array
   wrapping a single object). Every other file in the tree is a bare
   object. Confirm the frontend actually expects the array wrapper
   before assuming it's a one-off authoring mistake worth "fixing" —
   changing it silently would break the existing live file.
2. Each college has **`"categories"` instead of `"rounds"`**, keyed by
   category name (`"Open"`, `"OBC"`, `"SC"`, ...), and each category
   value is itself a `rounds`-shaped object (`Round 1`, `Round 2`, ...
   each with `Intake`/`AIR`/`SML`). So HP is one file per (state, quota)
   holding all categories, rather than one file per category like every
   other OPEN state.
3. `code` has been seen as `null` for at least one HP college — don't
   assume `code` is always populated.

If a new state (Rajasthan, AACCC-related states, etc.) doesn't match the
standard shape, treat that as its own exception to document here — do
not force it into the standard shape without checking, and do not assume
"looks close enough" is safe; the frontend keys off exact field names
(`isHP` branch in `cutoff_explorer.html`/`counsellor/index.html` special-
cases HP explicitly by state name).

## 4. Fees — confirmed field name and format

Exact key: **`"fees"`**, college-level, **string** type.

Source Selection List / target Excel files carry a `Tuition Fees` column
per the pipeline's parser — extract that value and write it verbatim (or
with your own consistent formatting) into `fees`. Existing files are
inconsistent in formatting across states (`"1,25,700"` vs `"1200117"` vs
`"11,100/-"`) — this is pre-existing real-world messiness, not a target
format to replicate. Pick one consistent format for pipeline-written data
going forward (e.g. always comma-grouped, no currency suffix) rather than
matching every historical variant.

**Year-over-year fee change handling**: if a college's fee value for the
new year differs from what's on file for the prior year (or conflicts
with a previously-seen value within the same run), flag for human review
rather than silently overwriting. Do not auto-resolve fee discrepancies.

## 5. Score — no home in this schema today

Explorer's JSON does not use a `Score` field on MCC or standard OPEN
files. It *does* appear on some MH reserved-category files (see §2
table), but those observed values look unreliable — in the sampled
`MH/2025/GOVT_BDS/SC/FEMALE.json` file, `Score` and `Intake` values are
cross-contaminated between rounds (e.g. `"Intake": "SC-1174"`,
`"Score": 16314` in different rounds of the same college) — this looks
like a pre-existing parsing bug in that source file, not a schema
you should replicate.

**Decision needed from user before the pipeline writes Score anywhere**:
add `Score` as a new field across all counsellings for consistency, or
leave Explorer's schema Score-free as today and let `computed_results`'
`score` column stay pipeline-internal only. Do not silently add or drop
it — this was flagged in the original Phase 2 spec and remains open.

## 6. New colleges (Step 2 fuzzy-match approvals)

When a genuinely-new college is approved in the pipeline's Seat Matrix
Merge step, it must be added to the matching category JSON file's
`colleges` array with `code`, `name`, `type`, `fees` populated and
`rounds` (or `categories` for HP-shaped files) present but empty (`{}`)
if no admission rounds have completed yet for that year. Do not omit the
college entirely until it has data — the college itself is confirmed
real; only the round data is pending.

## 7. Known issues to keep in mind during Phase 2 testing

- `cutoff_explorer.html` and `counsellor/index.html` are two independent
  copies of the same fetch/render logic (not shared code) — this
  contract's output should be validated against both, since a shape
  quirk one handles and the other doesn't will surface as one tool
  working and the other silently breaking.
- `student-explorer/index.html` is a third, confirmed-dead copy — do not
  target it, don't worry about breaking it.
- Some pre-existing MH source files contain corrupted round data
  (Intake/Score value swap, see §5) — the pipeline should not treat
  existing Explorer files as a gold-standard reference for validation:
  cross-check against the actual Selection List/Seat Matrix source
  instead where the two disagree.
