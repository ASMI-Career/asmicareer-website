// Apps Script web app that serves getStudent / saveDocStatus / saveShortlist for the student dashboard.
// NEXT_PUBLIC_DASHBOARD_URL lets a preview build point at a COPY of the sheet's script for testing; production leaves it empty.
export const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || (process.env.NEXT_PUBLIC_PREVIEW_BUILD ? '' : 'https://script.google.com/macros/s/AKfycbyL1UC5_EGNPKZcitbkQ38HOnKzgj5ObTZGroPcH0kpyHtjY-SpYYtyl3_jH0-rUR-x/exec');   // preview builds: no live fallback
