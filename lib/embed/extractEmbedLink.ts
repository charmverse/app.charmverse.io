export type LinkType = 'embed' | 'figma';

export function extractEmbedLink(url: string): { type: LinkType; url: string } {
  let embedUrl = url;
  let type: LinkType = 'embed';

  const isIframeEmbed = url.startsWith('<iframe ');
  const isFigma = url.includes('www.figma.com');
  if (isIframeEmbed) {
    const indexOfSrc = url.indexOf('src');
    const indexOfFirstQuote = url.indexOf('"', indexOfSrc);
    const indexOfLastQuote = url.indexOf('"', indexOfFirstQuote + 1);
    embedUrl = url.slice(indexOfFirstQuote + 1, indexOfLastQuote);
  } else if (isFigma) {
    type = 'figma';
  }

  return { type, url: embedUrl };
}
