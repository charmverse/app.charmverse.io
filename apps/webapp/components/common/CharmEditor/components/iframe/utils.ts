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
type IframeProps = {
  src: string;
  height: number | null;
  width: number | null;
};

export function extractIframeProps(pastedHtml: string): IframeProps | null {
  const isIframeHtml = pastedHtml.includes('<iframe');
  if (isIframeHtml) {
    const src = getParamFromString(pastedHtml, 'src');
    const height = getNumberFromString(pastedHtml, 'height');
    const width = getNumberFromString(pastedHtml, 'width');
    if (src) {
      return { src, height, width };
    }
  }
  return null;
}

function getNumberFromString(html: string, param: string): number | null {
  const extracted = getParamFromString(html, param);
  // ignore percentages
  if (extracted?.includes('%')) {
    return null;
  }
  const parsed = extracted ? parseInt(extracted.replace('px', '').trim(), 10) : null;
  // check if parsed is a number
  if (parsed && !Number.isNaN(parsed)) {
    return parsed;
  }
  return null;
}
function getParamFromString(html: string, param: string): string | null {
  const indexOfSrc = html.indexOf(param);
  if (indexOfSrc === -1) {
    return null;
  }
  // replace fancy quotes with normal quotes
  html = html.replaceAll('“', '"').replaceAll('”', '"');
  const indexOfFirstQuote = html.indexOf('"', indexOfSrc);
  const indexOfLastQuote = html.indexOf('"', indexOfFirstQuote + 1);
  return html.slice(indexOfFirstQuote + 1, indexOfLastQuote);
}
