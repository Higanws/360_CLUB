import {
  extractYoutubeVideoId,
  isDocumentationPlaceholderHost,
  normalizePlaybackInput,
  resolveNativeVideoSrc,
  resolveVideoEmbedSrc,
  youtubeEmbedUrl,
} from '../../../src/lib/youtube';

describe('activities / youtube', () => {
  it('extrae id de distintas URLs', () => {
    expect(
      extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
    expect(extractYoutubeVideoId('https://youtu.be/abc123')).toBe('abc123');
    expect(
      extractYoutubeVideoId('https://www.youtube.com/embed/xyz789'),
    ).toBe('xyz789');
  });

  it('youtubeEmbedUrl usa dominio nocookie', () => {
    expect(youtubeEmbedUrl('abc')).toContain('youtube-nocookie.com/embed/abc');
  });

  it('resolveVideoEmbedSrc solo YouTube (no iframes a páginas HTML arbitrarias)', () => {
    expect(resolveVideoEmbedSrc('https://www.youtube.com/watch?v=TAH8RxOS0VI')).toContain(
      'youtube-nocookie.com/embed/TAH8RxOS0VI',
    );
    expect(resolveVideoEmbedSrc('TAH8RxOS0VI')).toContain(
      'youtube-nocookie.com/embed/TAH8RxOS0VI',
    );
    expect(resolveVideoEmbedSrc('https://cdn.test.com/clip.mp4')).toBeNull();
    expect(resolveVideoEmbedSrc('  ')).toBeNull();
    expect(resolveVideoEmbedSrc('ftp://x')).toBeNull();
  });

  it('resolveNativeVideoSrc: archivo directo, no dominios de documentación', () => {
    expect(resolveNativeVideoSrc('https://cdn.test.com/clip.mp4')).toBe(
      'https://cdn.test.com/clip.mp4',
    );
    expect(
      resolveNativeVideoSrc('https://example.com/videos/press-banca-demo.mp4'),
    ).toBeNull();
    expect(resolveNativeVideoSrc('https://www.youtube.com/watch?v=x')).toBeNull();
  });

  it('normalizePlaybackInput: id suelto y URL sin esquema', () => {
    expect(normalizePlaybackInput('TAH8RxOS0VI')).toBe(
      'https://www.youtube.com/watch?v=TAH8RxOS0VI',
    );
    expect(normalizePlaybackInput('www.youtube.com/watch?v=TAH8RxOS0VI')).toBe(
      'https://www.youtube.com/watch?v=TAH8RxOS0VI',
    );
  });

  it('extractYoutubeVideoId acepta id suelto de 11 caracteres', () => {
    expect(extractYoutubeVideoId('TAH8RxOS0VI')).toBe('TAH8RxOS0VI');
  });

  it('extrae id aunque el texto no sea una URL válida entera', () => {
    expect(
      extractYoutubeVideoId('copiar: https://www.youtube.com/watch?v=TAH8RxOS0VI fin'),
    ).toBe('TAH8RxOS0VI');
  });

  it('resolveVideoEmbedSrc con URL rota pero con watch?v=', () => {
    expect(
      resolveVideoEmbedSrc('xxx https://www.youtube.com/watch?v=TAH8RxOS0VI'),
    ).toContain('youtube-nocookie.com/embed/TAH8RxOS0VI');
  });
  it('isDocumentationPlaceholderHost', () => {
    expect(isDocumentationPlaceholderHost('example.com')).toBe(true);
    expect(isDocumentationPlaceholderHost('www.youtube.com')).toBe(false);
  });
});
