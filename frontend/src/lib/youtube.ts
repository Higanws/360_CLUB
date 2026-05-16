/** Decodifica entidades típicas que a veces quedan en textos pegados desde HTML. */
function decodeCommonUrlEntities(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&#0*38;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*34;/gi, '"');
}

/** Longitud típica de id de vídeo YouTube: 11; aceptamos 6–64 por tests y enlaces viejos. */
const YT_ID_RE = '[a-zA-Z0-9_-]{6,64}';

/** Extrae id de vídeo por patrones si `URL` falla o el query está mal codificado. */
function extractYoutubeIdByRegex(s: string): string | null {
  const m =
    s.match(new RegExp(`[?&]v=(${YT_ID_RE})\\b`)) ||
    s.match(new RegExp(`youtu\\.be/(${YT_ID_RE})\\b`)) ||
    s.match(new RegExp(`youtube\\.com/embed/(${YT_ID_RE})\\b`)) ||
    s.match(new RegExp(`youtube\\.com/shorts/(${YT_ID_RE})\\b`));
  return m?.[1] ?? null;
}

/** Quita caracteres invisibles; añade https:// si falta; si pegaron solo el id de YouTube (11 chars), arma la URL watch. */
export function normalizePlaybackInput(raw: string): string {
  let s = String(raw ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();
  if (!s) return s;
  s = decodeCommonUrlEntities(s);
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (!s) return s;
  if (/^[a-z0-9_-]{6,64}$/i.test(s)) {
    return `https://www.youtube.com/watch?v=${s}`;
  }
  if (s.startsWith('//')) {
    s = 'https:' + s;
  } else if (!/^https?:\/\//i.test(s)) {
    if (/^(?:www\.)?(?:youtube\.com\/|youtu\.be\/)/i.test(s)) {
      s = 'https://' + s.replace(/^\/+/, '');
    }
  }
  return s;
}

/** Extrae el id de vídeo de YouTube para iframes (watch, embed, shorts, youtu.be). */
export function extractYoutubeVideoId(raw: string): string | null {
  const u = normalizePlaybackInput(raw);
  if (!u) return null;
  try {
    const url = new URL(u);
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      if (id && /^[a-zA-Z0-9_-]{6,64}$/.test(id)) return id;
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{6,64}$/.test(v.trim())) return v.trim();
      const embed = url.pathname.match(/\/embed\/([^/?]+)/);
      if (embed?.[1] && /^[a-zA-Z0-9_-]{6,64}$/.test(embed[1])) return embed[1];
      const shorts = url.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts?.[1] && /^[a-zA-Z0-9_-]{6,64}$/.test(shorts[1])) return shorts[1];
    }
  } catch {
    /* seguir con regex */
  }
  return extractYoutubeIdByRegex(u);
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
}

/** Dominios de ejemplo (IANA): en iframe muestran «Example Domain», nunca usar como embed. */
export function isDocumentationPlaceholderHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase();
  if (!h) return true;
  if (h === 'example.com' || h === 'example.org' || h === 'example.net') return true;
  if (h.endsWith('.example.com') || h.endsWith('.example.org')) return true;
  return false;
}

const DIRECT_VIDEO_PATH = /\.(mp4|webm|ogg|ogv|mov)(\?.*)?$/i;

/** URL apta para `<video src>` (archivo directo), no YouTube ni dominios de ejemplo. */
export function resolveNativeVideoSrc(raw: string): string | null {
  const u = normalizePlaybackInput(raw);
  if (!u) return null;
  if (extractYoutubeVideoId(u)) return null;
  try {
    const p = new URL(u);
    if (p.protocol !== 'http:' && p.protocol !== 'https:') return null;
    if (isDocumentationPlaceholderHost(p.hostname)) return null;
    if (!DIRECT_VIDEO_PATH.test(p.pathname)) return null;
    return u;
  } catch {
    return null;
  }
}

/** Solo YouTube: único caso fiable para `<iframe>` (evita cargar HTML tipo example.com). */
export function resolveVideoEmbedSrc(raw: string): string | null {
  const u = normalizePlaybackInput(raw);
  if (!u) return null;
  const vid = extractYoutubeVideoId(u);
  if (!vid) return null;
  try {
    const p = new URL(u);
    if (isDocumentationPlaceholderHost(p.hostname)) return null;
  } catch {
    /* URL ilegible pero el id salió por regex (p. ej. texto pegado sucio): el embed solo usa el id */
  }
  return youtubeEmbedUrl(vid);
}
