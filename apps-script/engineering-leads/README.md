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

## Student dashboard actions (`getStudent`, `saveShortlist`, `saveDocStatus`)

The engineering `/student` page talks to **this same web app** (set its URL as `NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL` when building the site).
They read and write the **"Student Dashboard"** tab of the Dashboard workbook, columns by header name.

| Call | How | Returns |
|---|---|---|
| `getStudent` | `GET <exec>?action=getStudent&token=ENG-…` | `{ success: true, data: { name, score, category, stage, tracks[], counsellor_name, counsellor_whatsapp, whatsapp_group_link, saved_colleges, document_status } }` |
| `saveShortlist` | `POST <exec>` body `{"action":"saveShortlist","token":"ENG-…","colleges":{"JOSAA":[…],"CAP":[…]}}` (text/plain JSON) | `{ success: true, count }` |
| `saveDocStatus` | `GET <exec>?action=saveDocStatus&token=ENG-…&data={"checked":[…],"category":"…","quota":"…"}` | `{ success: true }` |

* **Token is checked on the server.** It must be exactly `ENG-` + 10 characters from the token alphabet, must exist in the Token column, and its **Stream** cell must be `Engineering`. Anything else returns `{ "error": "not_found" }` (a Medical row behind an `ENG-` token is also `not_found`).
* **Only the fields above are returned.** No student or parent phone numbers, no other columns. `counsellor_whatsapp` is the **counsellor's** number (digits only), because the page's "Call the Advisor" button needs it. If you want no numbers at all in this response, say so and it can come from the website instead.
* `score` is a number with its decimals (98.37). `saved_colleges` is the grouped JSON saved by the shortlist; a damaged cell reads as `{}`. `whatsapp_group_link` is returned only if it starts with `http(s)://`.
* **Writes** take the script lock (`{ "error": "busy" }` if it cannot be had), validate their input (`{ "error": "invalid_input" }`), and write one cell as plain text. A shortlist is at most 300 items in 10 groups; a document list at most 500 ids of letters/digits/`_ . -`.
* Errors the browser sees: `not_found`, `invalid_input`, `busy`, `server_error` (never details). A missing or duplicated header returns `server_error`, writes nothing, and emails the admin (throttled).
* The page keeps `saveShortlist` last-write-wins, so it re-reads the student just before saving; the script itself does not merge.

**Headers the page columns need (assumed names, in `STUDENT_HEADERS`; add any that are missing to the "Student Dashboard" tab):**
`Token` · `Stream` · `Name` · `Score` · `Category` · `Stage` · `Tracks` (comma-separated, e.g. `JoSAA, Maharashtra CAP`) · `Counsellor Name` · `Counsellor WhatsApp` · `WhatsApp Group Link` · `Saved Shortlist` · `Document Status`.
Staff fill `Category`, `Stage`, `Tracks` and the counsellor columns; the page writes only `Saved Shortlist` and `Document Status`. `verifyHeaders()` reports missing ones. The lead flow does **not** need these columns, so it keeps working if they are not there yet.

### Copy test for the dashboard actions (no deployment of live data)
1. On the **copy** of the Dashboard workbook, add the headers above, then add one test student row: a real-format token (e.g. generated by `runSmokeTest()`), `Stream` = `Engineering`, a name, a score like `98.37`, `Category`, `Stage` = `Counselling Started`, `Tracks` = `JoSAA, Maharashtra CAP`, your own number as counsellor.
2. Run `verifyHeaders()`; fix anything it lists.
3. Deploy the copy-attached project as a **new** web app version (see Deploy below), then in a browser open
   `<exec>?action=getStudent&token=<your test token>`. Expect `success: true` and only the fields in the table. Try a wrong token, a Medical token and a lowercase token: all `not_found`.
4. Build a **preview** of the website with `NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL=<that exec URL>` and open `/student?token=<your test token>`. Tick a document and remove a shortlist item; check `Document Status` and `Saved Shortlist` in the copy sheet.
5. Rename one page header in the copy (e.g. `Tracks`), reload the page: it must show the "could not load" page, and you must get an email. Rename it back.
6. Only after the engineering lead has signed off: point the Script Properties at the live Dashboard workbook (and the live site build at the live URL).

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

* The `/student` dashboard does not read `Stream` or `Plan` yet and will show its Medical layout for an `ENG-` token. See the dashboard audit.
* The web app URL is public and the token is the only key to a dashboard row. Tokens are random (about 8×10¹⁴ possibilities) so they cannot be guessed in order, but anyone holding a token can open that student's dashboard.
* Parked leads contain phone numbers inside Script Properties (private to project editors).
* The static `inquiry-engineering.html` pages still use the old payload and old script. Only the Next.js form (`/engineering/inquiry`) was updated.
* The form keeps the rules merged in PR #196: **Indian mobile numbers only** and **percentile required**. The script is more permissive (accepts `+country code` and an empty percentile); loosen the form later if you want those.
* The extra form fields, consent box and spam trap only appear when `NEXT_PUBLIC_ENGINEERING_LEAD_URL` is set. Without it the form is exactly the #196 version.
* Preview safety from #196 applies: on any host other than asmicareer.in/.com the form shows the red TEST MODE bar. In Cloudflare, give **Preview** builds the URL of a script attached to the sheet COPIES and give **Production** the live one.
