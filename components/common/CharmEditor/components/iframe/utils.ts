import type { EmbedType } from './config';

export function extractEmbedType(url: string): EmbedType {
  let type: EmbedType = 'embed';

  const isAirtable = url.includes('airtable.com');
  const isFigma = url.includes('www.figma.com');
  if (isFigma) {
    type = 'figma';
  }
  if (isAirtable) {
    type = 'airtable';
  }

  return type;
}

export function extractUrlFromIFrame(url: string): { type: EmbedType; url: string } {
  let embedUrl = url;
  const type: EmbedType = 'embed';

  const isIframeEmbed = url.startsWith('<iframe ');
  if (isIframeEmbed) {
    const indexOfSrc = url.indexOf('src');
    const indexOfFirstQuote = url.indexOf('"', indexOfSrc);
    const indexOfLastQuote = url.indexOf('"', indexOfFirstQuote + 1);
    embedUrl = url.slice(indexOfFirstQuote + 1, indexOfLastQuote);
  }

  return { type, url: embedUrl };
}
