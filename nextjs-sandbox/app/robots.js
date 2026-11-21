import { SITE_URL } from '../lib/engCollegePage';

export const dynamic = 'force-static';

// /student pages are personal token links and must not be crawled.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/student'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
