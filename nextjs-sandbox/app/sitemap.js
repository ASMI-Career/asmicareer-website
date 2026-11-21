// Only the engineering college pages for now (a site-wide sitemap is a separate task). Pages that are not indexable
// (no branch/cutoff data and no description) are left out, matching their `noindex` robots tag.
import { SITE_URL, loadColleges, isIndexable } from '../lib/engCollegePage';

export const dynamic = 'force-static';

export default function sitemap() {
  const urls = [{ url: `${SITE_URL}/engineering/colleges` }];
  for (const c of loadColleges()) if (isIndexable(c)) urls.push({ url: `${SITE_URL}/engineering/colleges/${c.slug}` });
  return urls;
}
