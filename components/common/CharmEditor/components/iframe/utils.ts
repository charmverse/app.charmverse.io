import type { Slice } from 'prosemirror-model';

import { isUrl } from 'lib/utilities/strings';

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

// a utility for pasting: take a slice of content and extract the url from it if it includes an iframe
export function extractIframeUrl(slice: Slice): string | null {
  // @ts-ignore
  const contentRow = slice.content.content?.[0]?.content.content || [];
  const isIframeHtml = contentRow.some((node: { text: string }) => node.text?.includes('<iframe'));
  // the link ParseRule converts iframe html into separate text nodes. but we check for iframe html just in case
  const urls = contentRow
    .filter((node: { text: string }) => isUrl(node.text))
    .map((node: { text: string }) => node.text);
  if (isIframeHtml && urls.length) {
    const url = urls[0];
    const indexOfSrc = url.indexOf('src');
    const indexOfFirstQuote = url.indexOf('"', indexOfSrc);
    const indexOfLastQuote = url.indexOf('"', indexOfFirstQuote + 1);
    return url.slice(indexOfFirstQuote + 1, indexOfLastQuote);
  }
  return null;
}

export function convertFigmaToEmbedUrl(url: string) {
  return `https://www.figma.com/embed?embed_host=charmverse&url=${url}`;
}

export function convertAirtableToEmbedUrl(url: string) {
  if (url.includes('embed')) {
    return url; // already embeddable
  }
  const shareId = url.split('/').pop();
  return `https://airtable.com/embed/${shareId}`;
}
