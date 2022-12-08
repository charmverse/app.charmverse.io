import type { Slice } from 'prosemirror-model';

import { isUrl } from 'lib/utilities/strings';

import { embeds } from './config';
import type { EmbedType } from './config';

export function extractEmbedType(url: string): EmbedType {
  let type: EmbedType = 'embed';

  for (const embedType in embeds) {
    if ((embeds[embedType as EmbedType] as typeof embeds.airtable).urlTest?.(url)) {
      type = embedType as EmbedType;
      break;
    }
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
