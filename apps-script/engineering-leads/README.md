# Engineering lead flow (Google Apps Script)

A **separate, standalone** Apps Script project for engineering enquiries. It does not share code, deployment
or URL with the Medical scripts (`google-apps-script.js`, `google-apps-script-inquiry.js`) and never touches them.

```
Engineering form ──POST──> this script ──> Enquiry workbook (branch tab)      1 row per lead
                                      └──> Dashboard workbook (Student Dashboard)   1 row per new student, no phone numbers
                                      └──> 1 email per lead (optional)
```

## Files

| File | What it is |
|---|---|
| `engineering-leads.js` | The script. Paste into a **new** Apps Script project (see Deploy). |
| `test/mock-gas.js`, `test/run-tests.js` | Local mock tests. Run: `node apps-script/engineering-leads/test/run-tests.js` |
| `../../nextjs-sandbox/app/engineering/inquiry/page.js` | The website form, updated to send the new field names. |

## What it does, in order

1. **Validates** name, phone (Indian 10-digit starting 6–9, or international `+` country code with 7–15 digits), percentile (0–100, decimals kept), ranks, Score Exam, consent. A bad value returns a clear message to the form; nothing is written.
2. **Routes** by *Nearest Branch*: Andheri/Mumbai → Andheri, Thane, Pune, Sangli, Kolhapur, Sambhajinagar/Aurangabad. Unknown or blank → **Online**. *Source = Seminar* → **Seminar** (no alert email unless `SEMINAR_ALERTS=true`). **All Leads is never written.**
3. **Finds every column by header name.** If any required header is missing or duplicated, nothing is half-written: the lead is parked (below) and you get an email naming the header.
4. **Duplicate check:** same phone (any format) in any enquiry tab within 24 h. The new row is still saved but marked in *Duplicate Flag*; the student gets their **original** token back and **no second Dashboard row** is made. (A match that has a Medical-style token is flagged but the student still gets a new `ENG-` token.)
5. **Token** `ENG-` + 10 random characters (no `I L O 0 1`), checked against every Enquiry tab and both token columns of the Dashboard.
6. **Dashboard row:** Token, Date Added, Name, Score (= percentile), Stream = Engineering, Plan = Explore, Dashboard URL, Inquiry Token (= the same token). No phone numbers.
7. **Email** one alert per lead to `LEAD_ALERT_EMAIL` (empty = none). A mail error is logged and never loses the lead.
8. **WhatsApp:** `sendWhatsAppAlert_()` is an empty, clearly marked hook.
9. **Concurrency:** the whole write happens under `LockService`. If the lock cannot be had within 20 s, the lead is parked, not dropped.

### "Parked" leads (nothing is silently lost)
If the sheets cannot be written (missing header, workbook not reachable, lock busy, bad Script Properties) the validated lead is stored in
Script Properties as `PENDING_LEAD_*`, the student sees "details received", and staff get a per-lead email marked **NOT SAVED TO SHEET — QUEUED**.
After fixing the cause run **`replayPendingLeads()`**: it writes each one with its **original** timestamp. Capacity is 100 parked leads.

## Header names this script expects (assumed — change in the CONFIG block at the top of the script)

**Every Enquiry tab** (Online, Andheri, Thane, Pune, Sangli, Kolhapur, Sambhajinagar, Seminar), header row = row 1:

`Timestamp` · `Token` · `Full Name` · `Student Contact` · `Father Contact` · `Mother Contact` · `Coaching Class` · `City` · `Category` · `Courses` · `Budget` · `Nearest Branch` · `Entrance Percentile` · `Score Exam` · `JEE Main Rank (CRL)` · `JEE Advanced Rank` · `Exams Appearing` · `Home State` · `Class Status` · `Source` · `utm_source` · `utm_medium` · `utm_campaign` · `gclid` · `Plan` · `Consent` · `Duplicate Flag`

**Student Dashboard** tab: `Token` · `Date Added` · `Name` · `Score` · `Stream` · `Plan` · `Dashboard URL` · `Inquiry Token`

Matching ignores case and extra spaces, but the words must match. (The dashboard-page columns are listed in the next section.) Other columns (formulas, notes) are left alone. Run **`verifyHeaders()`** to check all tabs at once without writing anything.

## Script Properties (Project Settings → Script properties)

| Property | Required | Meaning |
|---|---|---|
| `ENQUIRY_SPREADSHEET_ID` | yes | ID of the Enquiry workbook (the long string in its URL) |
| `DASHBOARD_SPREADSHEET_ID` | yes | ID of the Dashboard workbook |
| `LEAD_ALERT_EMAIL` | no | Alert recipient(s), comma-separated. Empty = no email. |
| `ERROR_ALERT_EMAIL` | no | Setup/header errors. Falls back to `LEAD_ALERT_EMAIL`. |
| `DASHBOARD_BASE_URL` | no | Default `https://asmicareer.in/student` |
| `SEMINAR_ALERTS` | no | `true` = email for Seminar walk-ins |
| `REQUIRE_CONSENT` | no | Default on. `false` = don't require the consent tick. |
| `ENVIRONMENT` | no | `copy` puts `[TEST]` in email subjects |
| `ALLOW_SMOKE_TEST` | no | `true` lets `runSmokeTest()` write one fake lead. Leave off outside testing. |

## Test on COPIES first

1. In Google Drive: **File → Make a copy** of the Enquiry workbook and of the Dashboard workbook. (A copy also copies any script bound to it, with no triggers. Ignore that; this project is standalone.)
2. Create a new project at script.google.com → paste `engineering-leads.js`.
3. Set `ENQUIRY_SPREADSHEET_ID` and `DASHBOARD_SPREADSHEET_ID` to the **copies'** IDs, `ENVIRONMENT=copy`, your own email in `LEAD_ALERT_EMAIL`, `ALLOW_SMOKE_TEST=true`.
4. Run `verifyHeaders()` (approve permissions on first run). Fix any header it lists.
5. Run `runSmokeTest()`. Expect: one row in **Andheri** (copy) with token `ENG-…`, one row in Student Dashboard (copy), one `[TEST]` email.
6. Deploy (below) and submit the form from a test page pointing at the copy. Also try: bad phone, percentile 101, same phone twice, unknown branch, Seminar source, a renamed header.
7. Set `ALLOW_SMOKE_TEST` back to `false`.

## Deploy a NEW version

First deployment of this project:
1. **Deploy → New deployment → type: Web app.** Execute as: **Me**. Who has access: **Anyone**.
2. Copy the Web app URL (`…/exec`). This is the **new** engineering URL; it is different from the Medical one.
3. In Cloudflare Pages add the environment variable `NEXT_PUBLIC_ENGINEERING_LEAD_URL` = that URL and rebuild. Set it for **Preview** first (pointing at a deployment attached to the copies), and for **Production** only after sign-off. Until it is set, the form keeps using the old behaviour.

Shipping a later change (same URL, nothing to update on the website):
1. Edit the code → **Deploy → Manage deployments → ✏️ Edit** on the existing deployment → **Version: New version** → Deploy.
2. Run `verifyHeaders()` once.

**Going live** (only after the copy test is signed off): change the two ID properties to the live workbooks' IDs, set `ENVIRONMENT` empty, run `verifyHeaders()`, then submit one real test lead and delete that row by hand.

## Roll back

* **Bad code release:** Deploy → Manage deployments → ✏️ Edit → Version: choose the previous version → Deploy. The URL does not change. (Project history: File → Version history.)
* **Stop the new flow on the website:** remove `NEXT_PUBLIC_ENGINEERING_LEAD_URL` and rebuild. The form goes back to the old payload and old script. Note the old script puts engineering leads in the Medical *Online* tab, as it does today.
* Rows already written stay in the sheets; parked leads stay in Script Properties until `replayPendingLeads()` runs. Rolling back code does not delete either.

## Student dashboard actions (Google sign-in)

The engineering `/student` page talks to **this same web app** (`NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL`). **A link or token alone no longer works.**
The student signs in with Google; the page sends the Google ID token in the **body of a POST** (never in a URL). The script asks Google to verify it,
then serves **only the one "Student Dashboard" row whose `Approved Email` equals the verified email**.

| Action (POST, text/plain JSON, always with `idToken`) | Body fields | Returns |
|---|---|---|
| `getStudent` | none | `{ success: true, data: { name, score, category, stage, tracks[], counsellor_*, saved_colleges, document_status, profile fields … } }` |
| `saveShortlist` | `colleges` | `{ success: true, count }` |
| `saveDocStatus` | `data` (object or JSON text) | `{ success: true }` |
| `saveProfile` | `profile` | `{ ok: true, profile }` or `{ ok: false, error }` |
| `getPreferenceList` / `savePreferenceList` | `counselling` (+ `items`) | `{ ok: true, … }` or `{ ok: false, error }` |

GET never returns student data: any `?action=` answers `{ "error": "invalid_action" }`; no action is the health check.

**Checks on every call:** a Google token of the right shape → Google's `tokeninfo` says it is genuine → `aud` equals `GOOGLE_CLIENT_ID` → issuer is Google → not expired → `email_verified` → the email matches **exactly one** `Approved Email` cell (case and spaces ignored) → that row's Stream is `Engineering`. The sheet is read on every call, so removing an email locks that student out at once (a verified token is cached for at most 5 minutes, only to save Google calls).

**Answers are short codes only:** `auth_required` (no token), `auth_invalid` (bad/expired/foreign token), `not_approved` (email not on the sheet, on two rows, wrong stream, or the row has no Token), `invalid_input`, `busy`, `server_error`, plus the existing `locked`, `rate_limited`, `validation`. Nothing internal (no stack, no header names, no email, no token) is returned or logged.

**Writes** keep their checks: shortlist ≤ 300 items / 10 groups / 40,000 chars; document ids letters, digits and `_ . -`, ≤ 500; every value is saved as plain text; one script lock; profile and preference-list rate limits are per student (by the row's Token, which is now only an internal row id).

**New Script property:** `GOOGLE_CLIENT_ID` = the OAuth Web client ID (public value). **New sheet column:** `Approved Email` on the Student Dashboard tab, far right; found by header name. `verifyHeaders()` reports it if missing and the page fails closed.

**Sheet check (staff):** run `checkApprovedEmails()` from the editor. It writes the **"Email Check"** tab inside the Dashboard workbook: active students (Stream = Engineering, not at a stage in `INACTIVE_STAGES`, default `Admitted`) with a **blank**, **invalid** or **duplicate** Approved Email. Nothing is emailed or returned by the web app; the tab shows row numbers and names only.

**Not changed:** the lead form, lead routing, tokens on enquiry rows, and everything under "What it does".

Test it on COPIES first: see `../google-signin-copy-test.md` (covers this script, the Medical script and the website preview).

## Operating it

| Function (run from the editor) | When |
|---|---|
| `verifyHeaders()` | After any header or property change |
| `replayPendingLeads()` | After an error email that says leads are parked. Safe to repeat; can also run on a time trigger every 15 min. |
| `repairMissingDashboardRows()` | After an email "Dashboard row failed". Idempotent. |
| `runSmokeTest()` | On copies only |

## Decisions I made that you may want to change

* **Percentile is optional** (class 12 students may not have a score yet). If given, *Score Exam* is required.
* **Plan is forced to `Explore`.** The form sends it, but the server ignores any other value so a student cannot upgrade themselves. Paid plans are set by staff in the sheet.
* **Consent is required** (draft wording on the form; get it reviewed).
* **Invalid parent numbers** do not reject the lead: they are kept as typed and flagged in the email.
* **Validation failures reject the submission** (the form shows the message and keeps what was typed). They are not stored anywhere.
* **Error emails are throttled** to one per kind per 30 minutes; per-lead alerts are never throttled.
* Branch aliases: "Mumbai" → Andheri, "Aurangabad" → Sambhajinagar. Edit `BRANCH_ALIASES`.

## What the mock tests cannot prove

They run the real script against an in-memory fake. They do **not** show how real Google Sheets, Gmail, Script Properties or real simultaneous requests behave. Specifically untested: that Sheets keeps `+44…`/`=…` text as text after the plain-text format is applied; real lock contention; Gmail delivery/quota; Apps Script execution-time limits on very large sheets; the browser form talking to a deployed web app (CORS/redirect). The copy test above covers these.

## Known limits

* The web app URL is public, but a dashboard row can only be read or written with a Google sign-in whose verified email is on that row's `Approved Email`. The counsellor tools (`/counsellor`, `/engineering-counsellor`) still send a token to `getStudent`/`saveShortlist`; those token-only calls are gone, so those pages stop working until the staff sign-in is built.
* Parked leads contain phone numbers inside Script Properties (private to project editors).
* The static `inquiry-engineering.html` pages still use the old payload and old script. Only the Next.js form (`/engineering/inquiry`) was updated.
* The form keeps the rules merged in PR #196: **Indian mobile numbers only** and **percentile required**. The script is more permissive (accepts `+country code` and an empty percentile); loosen the form later if you want those.
* The extra form fields, consent box and spam trap only appear when `NEXT_PUBLIC_ENGINEERING_LEAD_URL` is set. Without it the form is exactly the #196 version.
* Preview safety from #196 applies: on any host other than asmicareer.in/.com the form shows the red TEST MODE bar. In Cloudflare, give **Preview** builds the URL of a script attached to the sheet COPIES and give **Production** the live one.
