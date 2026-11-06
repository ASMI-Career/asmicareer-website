# Student dashboard: per-stream config

One `/student` app, one config per stream. The stream comes from the token prefix in the link:
`ENG-…` is **engineering**, anything else is **medical** (`config/index.js`, `detectStream`).

| File | Status |
|---|---|
| `medical.json` | **LIVE.** Every value equals what the code used before the config existed. Do not change values without checking the live dashboard. |
| `engineering.provisional.json` | **PROVISIONAL.** A draft for the engineering lead to review and sign off. The `_confirm` list at the top names every assumption. |

## What the config controls
`modules` (which tabs exist; menus hide the rest) · `nav` · `tracks` · `student` (default name, score parsing, stages, default progress,
category and quota rules, counsellor defaults) · `dashboard` (labels, badges, red tag keywords, news link, shortlist icon, how many deadlines,
which tab "Edit List" opens) · `deadlines` (rules) · `documents` · `shortlist` (groups and rules) · `predictor` · `cutoff` · `institutes` ·
`fees` · `catalog` (data files and cutoff folders).

## Where each stream's data comes from
- Medical: the existing Student Dashboard Apps Script (`lib/config.js`).
- Engineering: set `NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL` at build time. While it is empty, an `ENG-` link shows
  "Your dashboard is not open yet" and makes no request.

## Events (`public/data/events.json`)
Optional fields: `stream` (`medical` | `engineering` | `all`; missing = medical), `track` (a track id or a list; missing = every track),
`status` (`confirmed` | `tentative`). Rules live in `lib/events.js`. The dashboard and both news pages use them.
