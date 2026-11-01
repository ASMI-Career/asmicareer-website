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

## Offline logic test (mock, NOT Google Sheets)
    node nextjs-sandbox/docs/lead-pipeline/harness.js

## Test on a COPY of the lead sheet before touching the live one
1. In Google Sheets: File > Make a copy of the lead sheet.
2. In the COPY: Extensions > Apps Script, paste `google-apps-script-inquiry.proposed.js`, set `LEAD_ALERT_EMAIL` to a test inbox.
3. Deploy > New deployment > Web app (Execute as: Me, Access: Anyone). Copy the /exec URL of the TEST deployment.
4. Build the site against it: `NEXT_PUBLIC_LEAD_ENDPOINT=<test /exec url> npm run build`, serve `out/`, and submit rows named "TEST - delete".
5. Check: row in the right tab, cols R-X filled, email received, Engineering tab created.
6. Only then update the LIVE script's deployment (Manage deployments > New version).
