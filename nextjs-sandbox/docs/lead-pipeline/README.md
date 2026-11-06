# Lead pipeline: PROPOSED Apps Script change (NOT deployed)

`google-apps-script-inquiry.proposed.js` is the repo's `google-apps-script-inquiry.js` with the lead-pipeline
changes applied; `google-apps-script-inquiry.patch` is the diff. The real script file is **unchanged**.

## What it changes
1. Engineering score: `entranceScore` -> new column T (kept out of column E so `rank` stays numeric).
2. Stream + branch written to every row (cols R, S); engineering leads go to a new **Engineering** tab (token prefix `ENG`).
3. Budget: no script change; the form now sends the same text the student saw.
4. Email alert per lead (`LEAD_ALERT_EMAIL`, empty until you set it) + empty `sendWhatsAppAlert_` hook.
5. Server-side validation (10-digit Indian mobile, name, rank/percentile). Seminar walk-ins may omit NEET rank.
6. utm_source / utm_medium / utm_campaign / gclid -> cols U-X.
7. Phones: India = 10 digits starting 6-9 (+91/91/0 prefix stripped). MEDICAL leads only (NRI / overseas): other countries =
   "+" + country code, 8-15 digits total (E.164), stored as text "+971501234567"; non-Indian numbers without "+" are rejected.
   ENGINEERING leads accept Indian numbers only (form and script).
8. Safety: columns R-X are only written if R1:X1 are empty or already ours; otherwise the lead is saved, the
   email still carries the data, and a line is logged. `auditLeadColumns()` (read-only) lists R-X usage per tab.

## Preview safety (website)
Builds served from any hostname other than asmicareer.in / www.asmicareer.in / asmicareer.com / www.asmicareer.com
(see `PRODUCTION_HOSTS` in `lib/leadForm.js`) never post to the live sheet: with `NEXT_PUBLIC_LEAD_ENDPOINT` unset
nothing is sent and a red TEST MODE bar is shown; with it set, leads go to that TEST endpoint (still with the bar).

## Files
- `new-frontend-payloads.json`: payloads captured from the real forms, replayed by the harness against the ORIGINAL and PROPOSED scripts.

## Offline logic test (mock, NOT Google Sheets)
    node nextjs-sandbox/docs/lead-pipeline/harness.js   # 61 checks incl. international phones and original-script replay

## Test on a COPY of the lead sheet before touching the live one
1. In Google Sheets: File > Make a copy of the lead sheet.
2. In the COPY: Extensions > Apps Script, paste `google-apps-script-inquiry.proposed.js`, set `LEAD_ALERT_EMAIL` to a test inbox,
   then run `auditLeadColumns()` once (read-only) and check every tab reports 0 cells in R-X.
3. Deploy > New deployment > Web app (Execute as: Me, Access: Anyone). Copy the /exec URL of the TEST deployment.
4. Build the site against it: `NEXT_PUBLIC_LEAD_ENDPOINT=<test /exec url> npm run build`, serve `out/`, and submit rows named "TEST - delete".
5. Check: row in the right tab, cols R-X filled, email received, Engineering tab created.
6. Only then update the LIVE script's deployment (Manage deployments > New version).
