import { log } from '@charmverse/core/log';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { DOMAIN_BLACKLIST } from 'lib/spaces/config';
import { getSpaceDomainFromUrlPath } from 'lib/utilities/getSpaceDomainFromUrlPath';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';

// RegExp for public files
const PUBLIC_FILE = /\.(.*)$/; // Files

export async function middleware(req: NextRequest) {
  // Clone the URL
  const url = req.nextUrl.clone();

  // Skip public files
  if (PUBLIC_FILE.test(url.pathname) || url.pathname.includes('_next')) return;
  // Skip api routes
  if (url.pathname.includes('/api/')) return;
  // Skip public pages
  // console.log('🔥nexturl:', req.nextUrl);
  const isPublicPage = DOMAIN_BLACKLIST.some((page) => url.pathname.startsWith(`/${page}`));
  // console.log('isPublicPage:', isPublicPage);
  if (isPublicPage) return;

  const host = req.headers.get('host');
  const subdomain = getValidSubdomain(host);
  const spaceDomainFromPath = getSpaceDomainFromUrlPath(url.pathname);

  if (subdomain && spaceDomainFromPath && spaceDomainFromPath === subdomain) {
    // We are on url with subdomain AND domain in path - redirect to url without domain in path
    const pathWithourSpaceDomain = url.pathname.replace(`/${spaceDomainFromPath}`, '') || '/';
    log.info(`>>> Redirecting: ${url.pathname} to ${pathWithourSpaceDomain}`);
    url.pathname = pathWithourSpaceDomain;

    return NextResponse.redirect(url);
  }

  // Skip main app url (TODO: verify this logic)
  if (subdomain === 'app') return;

  if (subdomain) {
    // Subdomain available, rewriting
    log.info(`>>> Rewriting: ${url.pathname} to /${subdomain}${url.pathname}`);
    url.pathname = `/${subdomain}${url.pathname}`;
  }

  return NextResponse.rewrite(url);
}
