import type { ParsedUrlQuery } from 'querystring';

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

// logic to easily replace our S3 domain to a new location
// example: https://s3.amazonaws.com/charm.public/user-content/... to https://charm.public.prd/user-content/...
export function replaceS3Domain<T extends string | undefined | null>(url: T) {
  if (!url) return url;
  return url.replace('https://s3.amazonaws.com/charm.public/', 'https://cdn.charmverse.io/');
}
