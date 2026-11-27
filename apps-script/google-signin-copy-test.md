# Google sign-in for /student: test on COPIES first (nothing here touches live)

Applies to: **Engineering script** (`engineering-leads/engineering-leads.js`), **Medical script** (`google-apps-script.js`), and the **website** (`nextjs-sandbox/app/student`).
Mock tests already pass (`node apps-script/engineering-leads/test/run-tests.js`, `profile-tests.js`, `pref-tests.js`, `medical-tests.js`), and a headless-browser test of the page passed with stand-ins for Google and the scripts. **None of that proves behaviour with real Google or real Sheets.** This checklist does.

## A. One-time Google setup (someone with the ASMI Google Cloud / Workspace admin)
1. Google Cloud console → create (or pick) a project → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
2. **Authorized JavaScript origins** (exact, no wildcards): `https://asmicareer.in` and the **preview host** you will test on (the Cloudflare branch preview URL, e.g. `https://<branch>.asmicareer-nextjs.pages.dev`). No redirect URIs are needed (the page uses the popup/One Tap button, not a redirect).
3. **OAuth consent screen:** name "ASMI Career", support email, scopes: only the defaults (`openid`, `email`, `profile`). Set **Publishing status = In production** before real students use it (in "Testing" only named test users can sign in). *Whether Google asks for a brand verification for your domain: not verified.*
4. Copy the **Client ID** (looks like `123…apps.googleusercontent.com`). It is public, not a secret.

## B. Engineering script, on a COPY
1. Drive → make a copy of the **Dashboard workbook** (and of the Enquiry workbook if you will also test the lead flow). Make a **new** Apps Script project (script.google.com) → paste `engineering-leads.js` (the project is standalone, as in the README).
2. Script properties: `DASHBOARD_SPREADSHEET_ID` = the **copy's** ID; `ENQUIRY_SPREADSHEET_ID` = the **copy's** ID; `ENVIRONMENT` = `copy`; **`GOOGLE_CLIENT_ID`** = the client ID from step A.
3. In the copy's **Student Dashboard** tab add the header **`Approved Email`** as the **last column**, plus the other page headers listed in the README if the copy lacks them. Add 4 FAKE students with Stream = `Engineering` and Gmail accounts you control: two normal, one with a **blank** email, one that **duplicates** another. Add one row with Stream = `Medical`.
4. Editor: run `verifyHeaders()` (approve permissions: it now also needs permission to **connect to an external service**, because the script calls Google to verify tokens). Fix anything it lists.
5. Run `checkApprovedEmails()`. Open the **Email Check** tab: it must list exactly the blank and duplicate rows (names and row numbers only). Fix the duplicate and re-run: "No problems found".
6. **Deploy → New deployment → Web app**, Execute as **Me**, access **Anyone**. This is a **new** URL. Do not edit the live deployment.

## C. Medical script, on a COPY
1. Make a copy of the **Medical dashboard workbook** (a bound script comes with it; its triggers do not). Replace the copy's script code with `google-apps-script.js`.
2. Script property `GOOGLE_CLIENT_ID`. On the copy's **Student Dashboard** tab add header **`Approved Email`** at the far right; fill 3 fake rows with your test Gmail accounts (one blank, one duplicate).
3. Reload the sheet: an **ASMI** menu appears. Click **ASMI → Check approved emails**; the **Email Check** tab must list the blank and the duplicate.
4. Deploy a **new** web app (Execute as Me, Anyone). New URL.

## D. Website preview pointing at the copies
In Cloudflare Pages → the project → **Settings → Environment variables → Preview** (not Production): `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = the client ID, `NEXT_PUBLIC_DASHBOARD_URL` = the **medical copy's** web app URL, `NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL` = the **engineering copy's** URL. Push the branch; open the **branch preview** URL `/student`. *(Earlier build logs showed dashboard variables not reaching the build; if the page ignores them, put the values in `next.config.mjs` for the preview branch instead.)*

## E. What to try (all on the preview + copies)
| # | Do this | Expect |
|---|---|---|
| 1 | Open `/student` with no sign-in | "Sign in to your dashboard" with a Google button; **no** request to a script in the Network tab |
| 2 | Open an old link `/student?token=ENG-…` | Same sign-in screen. The token is ignored |
| 3 | Sign in as a **medical** test student | Dashboard loads with that student's name only |
| 4 | Sign in as an **engineering** test student | Engineering theme and data |
| 5 | Sign in with a Google account **not** on either sheet | "This Google account is not registered"; no data |
| 6 | Sign in as the **blank** row's student, and as the **duplicate** | "not registered" (blank cannot match; duplicate refused) |
| 7 | In the browser, call the script URL directly: `<exec>?action=getStudent&token=<a real test token>` | `{"error":"invalid_action"}` |
| 8 | Tick a document, add and remove a shortlist item | The **right row's** `Document Status` / `Saved Shortlist` cells change as plain text, other rows untouched |
| 9 | (Engineering) Save the profile, edit the preference list | Saved on the right row; Preference Lists tab updated |
| 10 | In DevTools → Network look at every script request | All are **POST**; the URL has no token; the body has `idToken` |
| 11 | Clear the email from the student's row in the sheet, reload (after up to 5 min the cache is irrelevant) | "not registered" again |
| 12 | Leave the page open > 1 hour, then tick a document | Silent re-sign-in, or the "Please sign in again" box (your edits stay on screen) |
| 13 | Click **Sign out** | Back to sign-in; cached data for that student gone from `localStorage` (keys `asmi_student:g_…`) |
| 14 | Try an **iPhone Safari**, an **Android Chrome**, and the **WhatsApp / Instagram in-app browser** | Note which work. In-app browsers may block Google sign-in. *Not verified.* |
| 15 | Executions log (Apps Script) | No stack traces visible to the browser; logs contain no emails or tokens |

## F. Going live (only after you approve; each step separate)
1. Merge the website PR **with `NEXT_PUBLIC_GOOGLE_CLIENT_ID` still EMPTY in Production**. The page still uses the old link flow, so nothing changes for students.
2. Fill the **Approved Email** column on the **live** sheets (staff), run **Check approved emails / `checkApprovedEmails()`** until clean.
3. Paste the new script code into the **live** projects, set `GOOGLE_CLIENT_ID`, and **Deploy → Manage deployments → pencil → New version** (URL unchanged). **From this moment the old link flow and the counsellor pages stop working.**
4. Immediately set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Cloudflare **Production** and redeploy. Steps 3 and 4 should be minutes apart; pick a quiet hour.
5. Test with one real staff test student before announcing.

**Rollback:** Apps Script → Manage deployments → pencil → choose the previous version. Website: clear `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and redeploy (the link flow returns, but only works against the OLD script versions).

## G. Limits and unknowns (from memory; check the current Google pages)
- Each sign-in call makes one `UrlFetchApp` request to Google (cached 5 minutes per token). Apps Script has daily UrlFetch, runtime and simultaneous-execution quotas that differ for free Gmail and Workspace. *Not verified for ASMI's account.*
- Google ID tokens last about an hour.
- Students need a **Google account on the approved email**.
