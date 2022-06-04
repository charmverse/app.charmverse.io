export function extractEmbedLink (url: string) {
  const isIframeEmbed = url.startsWith('<iframe ');
  let embedUrl = url;

  const isRegularYTLink = url.includes('youtube');
  const isSharedYTLink = url.includes('youtu.be');
  if (isRegularYTLink || isSharedYTLink) {
    const { pathname, search } = new URL(url);
    const urlSearchParams = new URLSearchParams(search);
    if (isRegularYTLink) {
      embedUrl = `https://www.youtube.com/embed/${urlSearchParams.get('v')}`;
    }
    else if (isSharedYTLink) {
      embedUrl = `https://www.youtube.com/embed${pathname}`;
    }
    if (urlSearchParams.has('t')) {
      embedUrl += `?start=${urlSearchParams.get('t')}`;
    }
  }
  else if (isIframeEmbed) {
    const indexOfSrc = url.indexOf('src');
    const indexOfFirstQuote = url.indexOf('"', indexOfSrc);
    const indexOfLastQuote = url.indexOf('"', indexOfFirstQuote + 1);
    embedUrl = url.slice(indexOfFirstQuote + 1, indexOfLastQuote);
  }

  return embedUrl;
}
