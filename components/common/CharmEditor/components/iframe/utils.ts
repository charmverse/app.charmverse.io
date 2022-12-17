import type { Slice } from 'prosemirror-model';

import { isUrl } from 'lib/utilities/strings';

import { embeds } from './config';
import type { Embed, EmbedType } from './config';

export function extractEmbedType(url: string): EmbedType {
  let type: EmbedType = 'embed';

  for (const embedType in embeds) {
    if ((embeds[embedType as EmbedType] as Embed).urlTest?.(url)) {
      type = embedType as EmbedType;
      break;
    }
  }
  return type;
}

// a utility for pasting: take a slice of content and extract the url from it if it includes an iframe
export function extractIframeUrl(pastedHtml: string): string | null {
  const isIframeHtml = pastedHtml.includes('<iframe');
  if (isIframeHtml) {
    const indexOfSrc = pastedHtml.indexOf('src');
    const indexOfFirstQuote = pastedHtml.indexOf('"', indexOfSrc);
    const indexOfLastQuote = pastedHtml.indexOf('"', indexOfFirstQuote + 1);
    return pastedHtml.slice(indexOfFirstQuote + 1, indexOfLastQuote);
  }
  return null;
}
