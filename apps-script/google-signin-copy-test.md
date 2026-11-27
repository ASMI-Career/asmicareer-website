# Google sign-in for /student and the counsellor tools: test on COPIES first (nothing here touches live)

Applies to: the **student dashboard** (`/student`) and the two **counsellor tools** (`/counsellor`, `/engineering-counsellor`). Scripts: **Engineering script** (`engineering-leads/engineering-leads.js`), **Medical script** (`google-apps-script.js`), and the **website** (`nextjs-sandbox/app/student`).
Mock tests already pass (`node apps-script/engineering-leads/test/run-tests.js`, `profile-tests.js`, `pref-tests.js`, `medical-tests.js`), and a headless-browser test of the page passed with stand-ins for Google and the scripts. **None of that proves behaviour with real Google or real Sheets.** This checklist does.

## A. One-time Google setup (someone with the ASMI Google Cloud / Workspace admin)
1. Google Cloud console → create (or pick) a project → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
2. **Authorized JavaScript origins** (exact, no wildcards): `https://asmicareer.in` and the **preview host** you will test on (the Cloudflare branch preview URL, e.g. `https://<branch>.asmicareer-nextjs.pages.dev`). No redirect URIs are needed (the page uses the popup/One Tap button, not a redirect).
3. **OAuth consent screen:** name "ASMI Career", support email, scopes: only the defaults (`openid`, `email`, `profile`). Set **Publishing status = In production** before real students use it (in "Testing" only named test users can sign in). *Whether Google asks for a brand verification for your domain: not verified.*
4. Copy the **Client ID** (looks like `123…apps.googleusercontent.com`). It is public, not a secret.

## B. Engineering script, on a COPY
1. Drive → make a copy of the **Dashboard workbook** (and of the Enquiry workbook if you will also test the lead flow). Make a **new** Apps Script project (script.google.com) → paste `engineering-leads.js` (the project is standalone, as in the README).
2. Script properties: `DASHBOARD_SPREADSHEET_ID` = the **copy's** ID; `ENQUIRY_SPREADSHEET_ID` = the **copy's** ID; `ENVIRONMENT` = `copy`; **`GOOGLE_CLIENT_ID`** = the client ID from step A.
3. In the copy's **Student Dashboard** tab add the header **`Approved Email`** as the **last column**, plus the other page headers listed in the README if the copy lacks them. Add FAKE students with Stream = `Engineering` and Gmail accounts you control: two normal, one with a **blank** email, and two **twins** whose cells each list their own email **and** the same parent email (see the twins rows in E). Add one row with Stream = `Medical`. **An `Approved Email` cell may list several emails**, separated by commas, semicolons or new lines.
4. Editor: run `verifyHeaders()` (approve permissions: it now also needs permission to **connect to an external service**, because the script calls Google to verify tokens). Fix anything it lists.
5. Run `checkApprovedEmails()`. Open the **Email Check** tab: **Blank** and **Not a valid email** rows are problems; twins that share an email are listed under **"Shared emails (allowed; check these are intended)"** (names and row numbers only).
6. **Staff tab (counsellor tools):** in the copy workbook add a tab named exactly **`Staff`** with one column headed **`Staff Email`**. List 1–2 Google accounts you control (this is the ONLY list that can use the counsellor tools). Use a different account from the student test accounts.
7. **Deploy → New deployment → Web app**, Execute as **Me**, access **Anyone**. This is a **new** URL. Do not edit the live deployment.

## C. Medical script, on a COPY
1. Make a copy of the **Medical dashboard workbook** (a bound script comes with it; its triggers do not). Replace the copy's script code with `google-apps-script.js`.
2. Script property `GOOGLE_CLIENT_ID`. On the copy's **Student Dashboard** tab add header **`Approved Email`** at the far right; fill 3 fake rows with your test Gmail accounts (one blank, one duplicate).
3. Reload the sheet: an **ASMI** menu appears. Click **ASMI → Check approved emails**; the **Email Check** tab must list the blank and the duplicate.
4. Add a tab named exactly **`Staff`** with one column headed **`Staff Email`**; list 1–2 Google accounts you control.
5. Deploy a **new** web app (Execute as Me, Anyone). New URL.

## D. Website preview pointing ONLY at the copies
**Rule built into the site:** a Cloudflare **preview** build (any branch other than `main`) has **no live script URL at all**. Unless you give it URLs, `/student` says "not open yet" and the counsellor tools say "not set up on this test site", and they make **no** call to any script. Production builds keep the live URLs.
In Cloudflare Pages → the project → **Settings → Environment variables → Preview** (not Production) set exactly these three, all pointing at the **copies'** web-app URLs from B and C:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = the client ID from A
- `NEXT_PUBLIC_DASHBOARD_URL` = the **medical copy's** web app URL
- `NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL` = the **engineering copy's** web app URL
Push the branch, wait for the preview, and open the **branch preview** URL. *(Earlier build logs showed dashboard variables not reaching the build. Check first: open `<preview>/staff-config.json`. It must show your three values and `"preview":true`. If a URL is empty, the variables did not reach the build; stop and tell the developer. Do not test.)*
**Check before you test:** `<preview>/staff-config.json` must contain only the copy URLs. If you see the live script URL there, **stop**.
*Not covered by this rule:* the enquiry/lead forms (they have their own test setting, `NEXT_PUBLIC_LEAD_ENDPOINT` / `NEXT_PUBLIC_ENGINEERING_LEAD_URL`). Do not submit a real enquiry from the preview.

## E. What to try (all on the preview + copies)
| # | Do this | Expect |
|---|---|---|
| 1 | Open `/student` with no sign-in | "Sign in to your dashboard" with a Google button; **no** request to a script in the Network tab |
| 2 | Open an old link `/student?token=ENG-…` | Same sign-in screen. The token is ignored |
| 3 | Sign in as a **medical** test student | Dashboard loads with that student's name only |
| 4 | Sign in as an **engineering** test student | Engineering theme and data |
| 5 | Sign in with a Google account **not** on either sheet | "This Google account is not registered"; no data |
| 6 | Sign in with an account whose email is on **no** row (the stranger), and check a **blank** row cannot be opened | "not registered" |
| T1 | Twin A's own email | Opens only Twin A's dashboard |
| T2 | The **shared parent** email | "Whose dashboard do you want to open?" with both names and **no** dashboard data until you pick |
| T3 | Pick Twin B, tick a document and shortlist an institute | Only Twin B's row changes in the sheet; Twin A's cells are untouched |
| T4 | Click **Switch student** in the left menu and pick Twin A | Twin A opens, with none of Twin B's data on screen |
| T5 | Put the shared parent email on **11** rows (copy only), sign in as the parent | "not registered" (more than 10 rows is treated as a typo). Undo it afterwards |
| T6 | Type a **second email with a typo** in Twin A's cell (`good@x.com, bad`), run the check | Listed under **Not a valid email**; the valid email in that cell still signs in |
| 7 | In the browser, call the script URL directly: `<exec>?action=getStudent&token=<a real test token>` | `{"error":"invalid_action"}` |
| 8 | Tick a document, add and remove a shortlist item | The **right row's** `Document Status` / `Saved Shortlist` cells change as plain text, other rows untouched |
| 9 | (Engineering) Save the profile, edit the preference list | Saved on the right row; Preference Lists tab updated |
| 10 | In DevTools → Network look at every script request | All are **POST**; the URL has no token; the body has `idToken` |
| 11 | Clear the email from the student's row in the sheet, reload (after up to 5 min the cache is irrelevant) | "not registered" again |
| 12 | Leave the page open > 1 hour, then tick a document | Silent re-sign-in, or the "Please sign in again" box (your edits stay on screen) |
| 13 | Click **Sign out** | Back to sign-in; cached data for that student gone from `localStorage` (keys `asmi_student:g_…`) |
| 14 | Try an **iPhone Safari**, an **Android Chrome**, and the **WhatsApp / Instagram in-app browser** | Note which work. In-app browsers may block Google sign-in. *Not verified.* |
| 15 | Executions log (Apps Script) | No stack traces visible to the browser; logs contain no emails or tokens |
| **Counsellor tools (staff)** | | |
| S1 | Open `<preview>/counsellor/?token=<a medical test student's Token from the copy sheet>` | A "Staff sign-in" box covers the page. In the Network tab there is **no** call to the script yet |
| S2 | Sign in with a **student** test Gmail (not on the Staff tab) | "Not on the staff list". Only one call was made (`staffCheck`); no student data was requested |
| S3 | Sign in with a **staff** Gmail | The box goes away; the student's rank loads. All script calls are **POST**, no token in any URL, `idToken` in the body |
| S4 | Open `<preview>/counsellor/` with **no** `?token=` and sign in as staff | The tool opens in manual mode (no student). Nothing student-related is loaded |
| S5 | Add a college, press **Save Shortlist** | "Saved ✓". In the copy sheet the `Saved Shortlist` cell of THAT student (by Token) holds the list as text; other rows unchanged |
| S6 | Open `<preview>/engineering-counsellor/?token=<an engineering test student's Token>`, sign in as staff, press **Save** | The engineering copy's `Saved Shortlist` cell gets a `COUNSELLOR` group; the student's own `JOSAA` / `CAP` lists are still there |
| S7 | Remove the staff email from the **Staff** tab, reload the tool, sign in again | "Not on the staff list" at once |
| S8 | Delete the **Staff** tab (copy only), reload, sign in as that staff Gmail | "Not on the staff list" (fails closed). Put the tab back afterwards |
| S9 | Call a script URL directly in the browser: `<exec>?action=staffGetStudent&token=<Token>` | `{"error":"invalid_action"}` |
| S10 | As a signed-in **student**, try the counsellor page | Refused (the student's email is not on the Staff tab), even if you know a Token |

## F. Going live (only after you approve; each step separate)
1. Merge the website PR **with `NEXT_PUBLIC_GOOGLE_CLIENT_ID` still EMPTY in Production**. The page still uses the old link flow, so nothing changes for students.
2. Fill the **Approved Email** column on the **live** sheets (staff), run **Check approved emails / `checkApprovedEmails()`** until clean.
3. Paste the new script code into the **live** projects, set `GOOGLE_CLIENT_ID`, and **Deploy → Manage deployments → pencil → New version** (URL unchanged). **From this moment the old link flow and the counsellor pages stop working.**
4. Immediately set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Cloudflare **Production** and redeploy. Steps 3 and 4 should be minutes apart; pick a quiet hour.
5. Test with one real staff test student before announcing.
6. **Counsellor tools:** create the **`Staff`** tab (column `Staff Email`) in each **live** workbook before step 3, or counsellors are locked out the moment the scripts go live. The counsellor pages switch to Google sign-in at step 4 together with `/student` (one client-ID setting).
7. Tell counsellors beforehand: from step 4 they must sign in with their Google account, and old counsellor links keep working (the `?token=` in them is only the student's id, no longer a key).

**Rollback:** Apps Script → Manage deployments → pencil → choose the previous version. Website: clear `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and redeploy (the link flow returns, but only works against the OLD script versions).

## G. Limits and unknowns (from memory; check the current Google pages)
- Each sign-in call makes one `UrlFetchApp` request to Google (cached 5 minutes per token). Apps Script has daily UrlFetch, runtime and simultaneous-execution quotas that differ for free Gmail and Workspace. *Not verified for ASMI's account.*
- Google ID tokens last about an hour.
- Students need a **Google account on the approved email**; counsellors need a Google account listed on the **Staff** tab.
- The counsellor **pages themselves and the public cutoff data they load stay publicly fetchable** (they are static files). What is locked is every read and save of student data, which the script checks on the server.
- `/engineering-counsellor` used the **Medical** script's URL before this change (its saves therefore did not reach the engineering sheet). With sign-in on it uses the engineering script and stores its list under a `COUNSELLOR` group. *Whether the old behaviour worked on the live sheets: not verified.*
