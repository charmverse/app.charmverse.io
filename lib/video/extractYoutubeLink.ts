export function extractYoutubeLinkType(url: string) {
  if (url.includes('https://www.youtube.com/embed')) {
    return 'youtube_embed_link';
  } else if (url.includes('youtube.com')) {
    return 'youtube_link';
  } else if (url.includes('youtu.be')) {
    return 'youtube_shared_link';
  }
  return null;
}

export function extractYoutubeEmbedLink(url: string): string | null {
  const linkType = extractYoutubeLinkType(url);

  let embedUrl: string | null = null;
  if (linkType) {
    const { pathname, search } = new URL(url);
    const urlSearchParams = new URLSearchParams(search);
    if (linkType === 'youtube_link') {
      embedUrl = `https://www.youtube.com/embed/${urlSearchParams.get('v')}`;
    } else if (linkType === 'youtube_shared_link') {
      embedUrl = `https://www.youtube.com/embed${pathname}`;
    }
    // embed link
    else {
      embedUrl = url;
    }
    if (urlSearchParams.has('t')) {
      embedUrl += `?start=${urlSearchParams.get('t')}`;
    }
  }
  return embedUrl;
}
