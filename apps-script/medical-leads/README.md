# Medical lead flow + student dashboard backend (Google Apps Script)

A **separate** script, built like `../engineering-leads`. It does not touch the engineering script, the old medical inquiry script (`google-apps-script-inquiry.js`) or the old bound dashboard script (`google-apps-script.js`).

```
Medical enquiry form (asmicareer.in/medical/inquiry)
        │  POST
        ▼
This script ── ENQUIRY_SPREADSHEET_ID ──►  ENQUIRY workbook          one row per lead, one tab per branch
        │
        └──── DASHBOARD_SPREADSHEET_ID ─►  REGISTRATION workbook     "Student Dashboard" tab (+ "Staff" tab)
                                            (Mumbai for now; per-branch registration workbooks later)
Student dashboard (asmicareer.in/student)  ◄─ Google sign-in ─►  reads/writes ONLY the registration workbook
```

Two workbooks, kept separate on purpose. Every column is found by **header name**, so you can move or add columns freely (never rename the required ones, never repeat one).

## 1. The workbooks (paste-ready header rows are in `templates/`)

### ENQUIRY workbook: tabs `Online`, `Andheri`, `Thane`, `Pune`, `Sangli`, `Kolhapur`, `Sambhajinagar`, `Seminar` (+ an optional formula tab `All Leads` that the script never writes)
Row 1 of **every** branch tab: `templates/1-enquiry-workbook_EVERY-branch-tab_row1.tsv`
`Timestamp · Token Number · Student Name · Student Contact · NEET Rank (AIR) · Father Contact · Mother Contact · Coaching Class · City · Category · Courses · Budget · Branch · utm_source · utm_medium · utm_campaign · gclid · Plan · Duplicate Flag`
Staff do not type here; rows arrive from the form. Extra columns (notes, formulas) are left alone.

### REGISTRATION workbook (Mumbai)
**Tab `Student Dashboard`**, row 1: `templates/2-registration-workbook_Student-Dashboard-tab_row1.tsv`
`Token · Date Added · Student Name · NEET Rank (AIR) · NEET Score · Category · Stream · Plan · Branch · Stage · Counsellor Name · Counsellor WhatsApp · WhatsApp Group Link · Approved Email · Saved Shortlist · Document Status · Dashboard URL · Inquiry Token`

| Who fills it | Columns |
|---|---|
| The script, when a lead arrives | Token, Date Added, Student Name, NEET Rank (AIR), Category, Stream (`Medical`), Plan (`Explore`), Branch, Dashboard URL, Inquiry Token |
| **Staff, per student** | **Approved Email**, **Stage**, NEET Score, Counsellor Name, Counsellor WhatsApp, WhatsApp Group Link |
| The script, when the student works | Saved Shortlist, Document Status |

Stage values: `Enrolled`, `Documents Verified`, `Counselled`, `Preferences Filed`, `Round 1`, `Allotted` (blank is fine for a new lead).
**Tab `Staff`**: cell A1 `Staff Email`, then one counsellor Google email per row.
Tabs the script creates when needed: `Staff Log`, `Email Check`.
Do not add phone-number columns to the Student Dashboard tab; the script never reads or returns them.

## 2. Script Properties (Project Settings → Script properties)
| Name | Value |
|---|---|
| `ENQUIRY_SPREADSHEET_ID` | ID of the medical **enquiry** workbook |
| `DASHBOARD_SPREADSHEET_ID` | ID of the medical **registration** workbook |
| `GOOGLE_CLIENT_ID` | the OAuth Web client ID (public value) |
| `LEAD_ALERT_EMAIL` | where new-lead and error alerts go (optional but recommended) |
Others are optional (`ERROR_ALERT_EMAIL`, `DASHBOARD_BASE_URL`, `SEMINAR_ALERTS`). Never set `ENVIRONMENT=copy` or `ALLOW_SMOKE_TEST=true` on the live project.

## 3. How access works
- **Students/parents** (`/student`): Google sign-in; a student sees only the row(s) whose `Approved Email` cell lists their verified Google email. A cell may list several emails (comma/semicolon/new line); one email may be on several rows (twins with a shared parent email get a "Whose dashboard?" choice).
- **Counsellors**: a Google account on the `Staff` tab can open and edit any student (`/student`, "Viewing as staff") and use `/counsellor`. Every staff action is written to `Staff Log` first (time, staff email, Token, action; never content).
- The two lists are independent: removing someone from either ends that access at once.
- A new lead has a **blank** `Approved Email` until staff add the student's Google email; until then the student sees "not registered". Run `checkApprovedEmails()` (or the lists in `Email Check`) to see who is missing.

## 4. Website settings (Cloudflare Pages, project `asmicareer-website` for production)
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_MEDICAL_LEAD_URL` | this script's web-app URL: the medical **form** posts here (empty = the old script and old behaviour) |
| `NEXT_PUBLIC_DASHBOARD_URL` | the **same** web-app URL: the medical **dashboard** and counsellor tool call it (empty = the old live medical script) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | already set in Production for engineering |
For testing use the **`asmicareer-nextjs`** project's **Preview** variables with the URLs of a **test** deployment on test copies. Previews have no live script URL otherwise. Check `<preview>/staff-config.json`.

## 5. Behaviour you should know
- Branch routing: the form's `source`/`branch` value picks the tab (`Online` default; `Mumbai` → `Andheri`). Seminar walk-ins send no alert unless `SEMINAR_ALERTS=true`.
- NEET rank is optional in the script (a form still requires it), 1 to 2,500,000 when given.
- Same phone within 24 hours: the same token, a flagged second enquiry row, no second registration row.
- Consent is **not** collected: the current medical form has no consent box (the engineering form does).
- Parked leads: if a sheet cannot be written (missing header, lock busy), the lead is parked in Script Properties (`PENDING_LEAD_*`) and emailed as "NOT SAVED TO SHEET — QUEUED". Fix the cause, run `verifyHeaders()`, then `replayPendingLeads()`.
- All registrations currently go to ONE registration workbook (Mumbai). Per-branch registration workbooks need a small routing change later.
- This replaces the old medical inquiry script and the old dashboard script for the NEW batch. Retire the old `AKfycbz_0k…` inquiry script (public `doGet` returns phone numbers by token) once the old slide dashboard is no longer used.

## 6. Test and go-live order
1. Create the two **test** workbooks (or use the real new ones before launch) from `templates/`; add a `Staff` tab with your test staff Gmail.
2. New standalone Apps Script project → paste `medical-leads.js` → Script Properties → `verifyHeaders()` (must say OK) → `runSmokeTest` needs `ALLOW_SMOKE_TEST=true` (test project only).
3. Deploy as a Web app (Execute as: Me, Access: Anyone). Copy the URL.
4. Preview website: set `NEXT_PUBLIC_MEDICAL_LEAD_URL`, `NEXT_PUBLIC_DASHBOARD_URL` (same URL) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the **Preview** variables of `asmicareer-nextjs`; test the form, sign-in, twins, staff, counsellor tool (see `../google-signin-copy-test.md`).
5. Go live: put the real workbook IDs in the live project's properties, deploy, set the two URLs in `asmicareer-website` **Production**, redeploy, smoke-test, clean test rows.

Rollback: Deploy → Manage deployments → pencil → previous version. Website: clear the two URL variables and redeploy (the old behaviour returns).

## 7. Tests
`node apps-script/medical-leads/test/run-tests.js` (22 mock tests: lead flow, parking and replay, validation, sign-in, twins, staff, logs, checks). Mock results only: they do not prove behaviour on real Sheets, Gmail or Google sign-in.
