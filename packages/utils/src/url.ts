// logic to easily replace our S3 domain to a new location
import type { ParsedUrlQuery } from 'querystring';

export function replaceS3Domain<T extends string | undefined | null>(url: T) {
  if (!url) return url;
  return url.replace('https://s3.amazonaws.com/charm.public/', 'https://cdn.charmverse.io/');
}

// replace url with / into the full path of the url
export function replaceUrl(link: string, domain: string) {
  let protocol = '';
  let href = link;
  let text = link;

  try {
    const url = new URL(link);
    protocol = url.protocol;
    href = url.href;
    text = (url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname) || url.hostname;
  } catch (e) {
    protocol = 'https://';
    href = `${protocol}${domain}/${link}`;
  }

  return {
    href,
    text
  };
}

// add query params to a url
export function addQueryToUrl({
  url,
  query,
  replace,
  urlBase = 'http://localhost:3000'
}: {
  url: string;
  urlBase?: string;
  replace?: boolean;
  query?: ParsedUrlQuery | Record<string, string | null>;
}) {
  const result = new URL(url, url.trim().startsWith('http') ? undefined : urlBase);
  const queryParams = new URLSearchParams(result.search);
  for (const key in query) {
    if (query.hasOwnProperty(key)) {
      const value = query[key];
      if (typeof value === 'string') {
        queryParams.set(key, value);
      } else if (replace) {
        queryParams.delete(key);
      }
    }
  }
  result.search = queryParams.toString();
  return result;
}
