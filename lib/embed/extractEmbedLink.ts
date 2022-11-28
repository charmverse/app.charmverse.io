export type LinkType = 'embed' | 'video' | 'figma';

export function extractEmbedLink(url: string): { type: LinkType; url: string } {
  let embedUrl = url;
  let type: LinkType = 'embed';

  const isIframeEmbed = url.startsWith('<iframe ');
  const isRegularYTLink = url.includes('youtube');
  const isSharedYTLink = url.includes('youtu.be');
  const isFigma = url.includes('www.figma.com');
  if (isRegularYTLink || isSharedYTLink) {
    type = 'video';

    const { pathname, search } = new URL(url);
    const urlSearchParams = new URLSearchParams(search);
    if (isRegularYTLink) {
      embedUrl = `https://www.youtube.com/embed/${urlSearchParams.get('v')}`;
    } else if (isSharedYTLink) {
      embedUrl = `https://www.youtube.com/embed${pathname}`;
    }
    if (urlSearchParams.has('t')) {
      embedUrl += `?start=${urlSearchParams.get('t')}`;
    }
  } else if (isIframeEmbed) {
    const indexOfSrc = url.indexOf('src');
    const indexOfFirstQuote = url.indexOf('"', indexOfSrc);
    const indexOfLastQuote = url.indexOf('"', indexOfFirstQuote + 1);
    embedUrl = url.slice(indexOfFirstQuote + 1, indexOfLastQuote);
  } else if (isFigma) {
    type = 'figma';
  }

  return { type, url: embedUrl };
}
