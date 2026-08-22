/**
 * Downloads an image to the user's device as a file.
 *
 * A plain <a href download> does NOT work for cross-origin URLs — browsers
 * ignore the `download` attribute and navigate to the image instead. So we
 * always fetch the image as a Blob first, then save it via an object URL,
 * which the browser treats as same-origin and downloads reliably.
 *
 * Falls back to opening the image in a new tab only if the fetch fails
 * entirely (e.g. offline or host blocks cross-origin reads).
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  if (!url) return;
  try {
    let href = url;
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`fetch failed with status ${res.status}`);
      const blob = await res.blob();
      href = URL.createObjectURL(blob);
    }
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (href !== url) setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}

/** Picks a sensible extension from a blob/data URL's mime type. */
export function extFromMime(mime: string | null | undefined, fallback = 'png'): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/svg+xml') return 'svg';
  return fallback;
}
