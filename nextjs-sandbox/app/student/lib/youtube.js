// Turns a YouTube link into a video ID. Accepts watch?v=ID, youtu.be/ID and /shorts/ID (with or without www / m.).
// Returns null for anything else, so the caller can skip the item.
const ID_RE = /^[A-Za-z0-9_-]{11}$/;
export function youtubeId(url) {
  let u;
  try { u = new URL(String(url || '').trim()); } catch (e) { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.replace(/^(www\.|m\.)/, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2];
  }
  return id && ID_RE.test(id) ? id : null;
}
export const youtubeEmbedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}`;
