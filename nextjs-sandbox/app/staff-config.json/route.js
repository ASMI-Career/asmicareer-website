import { APPS_SCRIPT_URL } from '../student/lib/config';
import { endpointFor } from '../student/config';

// Written once at build time as /staff-config.json. The two counsellor tools (static pages in /public) read it, so they never hard-code a script URL:
// a preview build can only point at the COPIES you gave it (see next.config.mjs), production at the live scripts.
// Nothing secret is in here: the Google client ID and the web-app URLs are all visible in any page that uses them.
export const dynamic = 'force-static';

export function GET() {
  return Response.json({
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    medicalUrl: APPS_SCRIPT_URL || '',
    engineeringUrl: endpointFor('engineering') || '',
    preview: !!process.env.NEXT_PUBLIC_PREVIEW_BUILD,
  });
}
