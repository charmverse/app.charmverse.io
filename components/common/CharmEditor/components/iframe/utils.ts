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
export function extractIframeProps(pastedHtml: string): { src: string; height: number | null } | null {
  const isIframeHtml = pastedHtml.includes('<iframe');
  if (isIframeHtml) {
    const src = getParamFromString(pastedHtml, 'src');
    const height = getParamFromString(pastedHtml, 'height');
    if (src) {
      const heightInt = height ? parseInt(height, 10) : null;
      return { src, height: heightInt };
    }
  }
  return null;
}

function getParamFromString(html: string, param: string): string | null {
  const indexOfSrc = html.indexOf(param);
  if (indexOfSrc === -1) {
    return null;
  }
  const indexOfFirstQuote = html.indexOf('"', indexOfSrc);
  const indexOfLastQuote = html.indexOf('"', indexOfFirstQuote + 1);
  return html.slice(indexOfFirstQuote + 1, indexOfLastQuote);
}
