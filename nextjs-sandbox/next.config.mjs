// The engineering script URL is public (it is visible in the page code of any form that uses it), so it is kept
// here instead of in a Cloudflare dashboard variable: the production build log showed
// "Build environment variables: (none found)", i.e. dashboard variables were not reaching the build.
// A Cloudflare/CLI variable with the same name still wins, so this can be overridden or cleared later.
const ENGINEERING_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzv5tXbxUxYLPS5IxX0Bz4wGJTkc3APV0HKpmzut6BHqj5kKXc3B1E4UiFN6tDLry-G9Q/exec';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_ENGINEERING_LEAD_URL: process.env.NEXT_PUBLIC_ENGINEERING_LEAD_URL || ENGINEERING_SCRIPT_URL,
    NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL: process.env.NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL || ENGINEERING_SCRIPT_URL,
    // Google sign-in for /student. Empty = the old link-token behaviour. The client ID is a public value (not a secret), so it can live here like the script URLs.
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    // Preview builds only: point /student at a COPY of the Medical sheet's script. Empty in production.
    NEXT_PUBLIC_DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL || '',
  },
};

export default nextConfig;
