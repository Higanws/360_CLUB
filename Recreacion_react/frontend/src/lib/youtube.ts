/** Extrae el id de vídeo de YouTube para iframes (watch, embed, shorts, youtu.be). */
export function extractYoutubeVideoId(raw: string): string | null {
  const u = raw.trim();
  if (!u) return null;
  try {
    const url = new URL(u);
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return id || null;
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const embed = url.pathname.match(/\/embed\/([^/?]+)/);
      if (embed?.[1]) return embed[1];
      const shorts = url.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts?.[1]) return shorts[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
}
