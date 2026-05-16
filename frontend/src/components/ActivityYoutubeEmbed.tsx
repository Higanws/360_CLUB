import {
  extractYoutubeVideoId,
  resolveNativeVideoSrc,
  resolveVideoEmbedSrc,
} from '../lib/youtube';

type Props = {
  url: string;
  /** Texto accesible del iframe */
  iframeTitle?: string;
};

/**
 * YouTube → iframe embed (nocookie).
 * Archivo .mp4/.webm/… → `<video controls>`.
 * Otras URLs (p. ej. example.com) no se cargan en iframe para no mostrar páginas HTML ajenas.
 */
export function ActivityYoutubeEmbed({ url, iframeTitle }: Props) {
  const safe = String(url ?? '').trim();
  const iframeSrc = resolveVideoEmbedSrc(safe);
  const nativeSrc = resolveNativeVideoSrc(safe);

  if (iframeSrc) {
    const vid = extractYoutubeVideoId(safe);
    const title = iframeTitle ?? (vid ? `YouTube ${vid}` : 'Vídeo del ejercicio');
    return (
      <div className="activity-video-embed">
        <iframe
          title={title}
          src={iframeSrc}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (nativeSrc) {
    return (
      <div className="activity-video-embed">
        <video
          className="activity-video-native"
          src={nativeSrc}
          controls
          playsInline
          preload="metadata"
        >
          Tu navegador no reproduce vídeo HTML5.
        </video>
      </div>
    );
  }

  return (
    <p className="muted small activity-video-embed-invalid">
      Enlace no reproducible aquí. Pedí al club que use un enlace de YouTube (por ejemplo
      youtube.com/watch?v=…) o la URL directa de un archivo .mp4 / .webm.
    </p>
  );
}
