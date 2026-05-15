import {
  extractYoutubeVideoId,
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
});
