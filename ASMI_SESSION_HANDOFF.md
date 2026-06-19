# ASMI Cutoff Explorer — Session Handoff
**Date:** June 19, 2026  
**Project:** asmicareer.in student dashboard — Cutoff Explorer feature  
**Developer:** Devan (Antigravity AI)  
**Next upload needed:** Maharashtra State Quota files (MH CAP)

---

## What Has Been Built This Session

### 1. Cutoff Explorer UI
File: `C:\Users\devan\Desktop\asmicareer-website\cutoff_explorer.html`

Full redesign spec delivered in three prompts:
- **Prompt 1:** Brand fixes, nav fixes, chance logic fix, Type column removal, stray toggle, data loading structure
- **Prompt 2 (MCC):** MCC wiring with 8 institution types
- **Prompt 3 (Open States):** Open States wiring for 17 states

UI features:
- Three counselling types: MH State, MCC AIQ, Open States
- Category/quota chip selector per counselling
- Round-wise table: Round 1/2/3 visible by default, stray rounds behind toggle
- Per-round chance coloring on AIR cell: Safe (green) / Likely (blue) / Borderline (amber) / Out of Reach (gray)
- Student rank pre-loaded from token — no manual input
- Year tabs (2025 active, 2024/2023/2022 grayed out)
- Search, compare checkbox, pagination

Chance thresholds (same as Predictor):
- Safe: rank ≤ AIR × 0.88
- Likely: rank ≤ AIR
- Borderline: rank ≤ AIR × 1.12
- Out of reach: beyond (no color, no tag)

Brand tokens: Navy #1A0040, Purple #6A0DAD, Gold #FFD700. Orange (#e8460d) removed.

---

### 2. Data Compiled & Delivered

#### MCC AIQ — `data/cutoffs/MCC/2025/`
8 institution type folders, each with category JSONs:

| Folder | Sheets | Colleges/sheet |
|--------|--------|----------------|
| GOVT_MBBS | OPEN, OBC, EWS, SC, ST | 421 |
| AIIMS_MBBS | OPEN, OBC, EWS, SC, ST | 20 |
| JIPMER_MBBS | OPEN, OBC, EWS, SC, ST | 2 |
| CENTRAL_MBBS | OPEN, OBC, EWS, SC, ST | 2 |
| DEEMED_MBBS | OPEN, NRI_P-I, NRI_P-II, MINORITY | 58 |
| GOVT_BDS | OPEN, OBC, EWS, SC, ST | 50 |
| CENTRAL_BDS | OPEN, OBC, EWS, SC, ST | 3 |
| DEEMED_BDS | OPEN, NRI_P1, NRI_P2, MINORITY | 34 |

MCC JSON structure:
```json
{
  "counselling": "MCC",
  "institution_type": "GOVT_MBBS",
  "year": 2025,
  "category": "OPEN",
  "colleges": [{
    "code": "200219",
    "name": "Grant Medical College, Mumbai",
    "state": "Maharashtra",
    "establishment": 1845,
    "fees": "1,25,700",
    "type": "Govt",
    "rounds": {
      "Round 1": { "Intake": 16, "AIR": 2368, "AIR_PWD": 181340 },
      "Round 2": { "Intake": 11, "AIR": 4354, "AIR_PWD": 204368 },
      "Round 3": { "Intake": 6,  "AIR": 6251, "AIR_PWD": 169345 },
      "Stray Vacancy Round": { "Intake": 1, "AIR": 10798, "AIR_PWD": null },
      "Special Stray Vacancy Round": { "Intake": null, "AIR": null, "AIR_PWD": null }
    }
  }]
}
```
Note: DEEMED files have no AIR_PWD. Deemed fees are raw integers (e.g. 1790000) → format as ₹17,90,000.

#### Open States — `data/cutoffs/OPEN/2025/`
17 state folders compiled. 444 total records.

| State | Quotas compiled |
|-------|----------------|
| Andhra Pradesh | COUNSELOR, NRI, GOV_NRI |
| Bihar | MGT, MINORITY, NRI |
| Chhattisgarh | UR, UR_FEM, UR_NRI, UR_FEM_NRI |
| Haryana | MQ, MQ_MINORITY |
| Himachal Pradesh | MQ_NRI (pivot structure — see note) |
| Jharkhand | MQ, NRI |
| Karnataka | MQ, NRI, OTH, RC8 |
| Kerala | MQ only (NRI skipped — incompatible format) |
| Manipur | MQ, NRI |
| Meghalaya | MQ, NRI |
| Pondicherry | MQ, NRI |
| Sikkim | General, Management |
| Tamil Nadu | OPEN, NRI |
| Telangana | MQ, NRI |
| Uttar Pradesh | MQ, MINORITY |
| Uttarakhand | MQ, NRI |
| West Bengal | MQ, NRI |

Standard Open State JSON structure:
```json
{
  "counselling": "OPEN",
  "state": "Telangana",
  "year": 2025,
  "quota": "MQ",
  "colleges": [{
    "code": "APLO",
    "name": "Apollo Institute of Medical Sciences, Hyderabad",
    "establishment": 2012,
    "fees": "13,00,000",
    "type": "Private",
    "rounds": {
      "Round 1":   { "Intake": 8, "AIR": 53496, "SML": 19 },
      "Round 2":   { "Intake": 4, "AIR": 70436, "SML": 46 },
      "Mop Up Round": { "Intake": 2, "AIR": 74953, "SML": 62 }
    }
  }]
}
```

Three structural exceptions for frontend:
- **Karnataka:** No SML key — omit SML column entirely
- **Kerala MQ:** No per-round Intake, has `total_intake` as fixed field, rounds have AIR+SML only
- **Himachal Pradesh:** Single college, `categories` key instead of `rounds` — render as category sub-rows

All Open State fees are raw integers (e.g. 1200000) → format as ₹12,00,000.
Exception: Tamil Nadu fees come as formatted strings ("51,345/-") → strip /- and prepend ₹.

---

### 3. Compiler Scripts

Two Python scripts ready:
- `cutoff_compiler.py` — handles MH State + MCC + standard Open States
- `open_state_compiler.py` — handles all 17 Open State files with structural variant detection

Both output normalized JSON to `output/<TYPE>/2025/<folder>/` structure.

---

## PENDING: Maharashtra State (MH CAP) Data

**Not yet uploaded or compiled.** This is the next step.

Expected MH file types based on what was discussed:
- MH Govt MBBS (Open quota file already seen: OPEN_.xlsx)
- MH Private MBBS
- MH BDS (Govt + Private)
- MH AYUSH (BAMS, BHMS, BPT)

### MH data structure (confirmed from OPEN_.xlsx):
- Sheets = categories: GENERAL, FEMALE, HA GENERAL, HA FEMALE, OBC, SC, ST, EWS, PWD, ORPHAN
- 2-row header: Row0 = round names, Row1 = sub-col names
- Per round: Intake, AIR, SML (Score dropped)
- Reserved categories (OBC/SC/ST/EWS) also have CSML column
- Rounds: Round 1, Round 2, Round 3, Stray Round 1, Stray Round 2, Stray Round 3, Special Stray Round

### MH JSON output path:
```
data/cutoffs/MH/2025/<quota_type>/<CATEGORY>.json
```
e.g. `data/cutoffs/MH/2025/GOVT_MBBS/GENERAL.json`

### MH JSON structure:
```json
{
  "counselling": "MH",
  "year": 2025,
  "quota_type": "GOVT_MBBS",
  "category": "GENERAL",
  "colleges": [{
    "code": "1103",
    "name": "Seth G.S. Medical College, Mumbai",
    "establishment": 1925,
    "fees": "1,71,180",
    "type": "Govt",
    "rounds": {
      "Round 1": { "Intake": 34, "AIR": 971, "SML": 63 },
      "Round 2": { "Intake": 32, "AIR": 2430, "SML": 205 },
      "Round 3": { "Intake": 1,  "AIR": 2571, "SML": 209 },
      "Stray Round 1": { "Intake": null, "AIR": null, "SML": null }
    }
  }]
}
```
For reserved categories (OBC/SC/ST/EWS), rounds additionally contain `"CSML": <value>`.

### MH frontend notes for Devan:
- CSML column appears only when counselling = MH AND category is OBC/SC/ST/EWS
- MH has no State column (all Maharashtra)
- MH table sub-columns: Intake | AIR | SML | CSML (last only for reserved categories)

---

## Data Output Folder Summary

Once all data is compiled, final folder structure on server:
```
data/cutoffs/
├── MCC/2025/
│   ├── GOVT_MBBS/     ✅ done
│   ├── AIIMS_MBBS/    ✅ done
│   ├── JIPMER_MBBS/   ✅ done
│   ├── CENTRAL_MBBS/  ✅ done
│   ├── DEEMED_MBBS/   ✅ done
│   ├── GOVT_BDS/      ✅ done
│   ├── CENTRAL_BDS/   ✅ done
│   └── DEEMED_BDS/    ✅ done
├── OPEN/2025/
│   ├── Andhra_Pradesh/ ✅ done
│   ├── Bihar/          ✅ done
│   ├── Chhattisgarh/   ✅ done
│   ├── Haryana/        ✅ done
│   ├── Himachal_Pradesh/ ✅ done
│   ├── Jharkhand/      ✅ done
│   ├── Karnataka/      ✅ done
│   ├── Kerala/         ✅ done (MQ only)
│   ├── Manipur/        ✅ done
│   ├── Meghalaya/      ✅ done
│   ├── Pondicherry/    ✅ done
│   ├── Sikkim/         ✅ done
│   ├── Tamil_Nadu/     ✅ done
│   ├── Telangana/      ✅ done
│   ├── Uttar_Pradesh/  ✅ done
│   ├── Uttarakhand/    ✅ done
│   └── West_Bengal/    ✅ done
└── MH/2025/
    ├── GOVT_MBBS/      ⏳ pending upload
    ├── PRIVATE_MBBS/   ⏳ pending upload
    ├── GOVT_BDS/       ⏳ pending upload
    ├── PRIVATE_BDS/    ⏳ pending upload
    └── AYUSH/          ⏳ pending upload
```

---

## Known Issues / To-Do

1. **Kerala NRI** — skipped. Uses R-AIR/R-SML format (registration vs minority split). Needs source Excel restructured before compilation.
2. **No-token / invalid-token fallback** on student dashboard — was flagged early in the project, never confirmed fixed. Worth retesting: does `?token=GARBAGE123` still render a populated dashboard page?
3. **Preference List** — confirmed unbuilt scope. Needs: strict ordering, three-role access (counsellor/student/form-filling team), edit-locking once form filling begins.
4. **Document Verification toggle** — Done/Pending per document per student, Mumbai-only. Not yet built.
5. **Curated Updates feed** — manual admin posting panel (not full Telegram automation). Not yet built.

---

## Cutoff Explorer UI — Antigravity Prompt Status

Three prompts already delivered to Devan:
1. ✅ Brand fixes + structural fixes + data loading spec
2. ✅ MCC data wiring (with zip file)
3. ✅ Open States data wiring (with zip file)

Remaining prompt needed:
4. ⏳ MH State data wiring (after MH files are compiled)

---

## Key Context for Next Session

- Student rank is token-locked. No "enter your rank" input needed — rank comes from session.
- Year toggle: 2025 active. 2024/2023/2022 grayed out. Once MH/MCC/Open data is confirmed stable, add past years by running compiler on historical files.
- CSML appears only for MH reserved categories. No other counselling type has it.
- Round names are always data-driven (read from JSON keys). Never hardcode round names.
- Stray round detection rule: any round key containing "Stray", "Extended", or "Additional" → hide by default.
- Fees formatting rule: raw integers (e.g. 1200000) → ₹12,00,000 using Indian locale. Formatted strings (e.g. "1,25,700") → prepend ₹ only.
