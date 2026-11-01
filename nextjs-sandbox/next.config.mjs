// The engineering script URL is public (it is visible in the page code of any form that uses it), so it is kept
// here instead of in a Cloudflare dashboard variable: the production build log showed
// "Build environment variables: (none found)", i.e. dashboard variables were not reaching the build.
// A Cloudflare/CLI variable with the same name still wins, so this can be overridden or cleared later.
const ENGINEERING_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw1zJfbK7rYbBbAm14fsOV25F7arzJNnrWrJ6cEZ0zKuyPn_xw_MYcR_L-DuI77Avsf/exec';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_ENGINEERING_LEAD_URL: process.env.NEXT_PUBLIC_ENGINEERING_LEAD_URL || ENGINEERING_SCRIPT_URL,
    NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL: process.env.NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL || ENGINEERING_SCRIPT_URL,
  },
};

export default nextConfig;
