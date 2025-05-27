import { getAppApexDomain } from '@packages/lib/utils/domains/getAppApexDomain';
import { getCustomDomainFromHost } from '@packages/lib/utils/domains/getCustomDomainFromHost';
import { getSpaceDomainFromHost } from '@packages/lib/utils/domains/getSpaceDomainFromHost';
import { getSpaceDomainFromUrlPath } from '@packages/lib/utils/domains/getSpaceDomainFromUrlPath';
import { DOMAIN_BLACKLIST } from '@packages/spaces/config';
import { isDevEnv } from '@packages/utils/constants';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// RegExp for public files
const PUBLIC_FILE = /\.(.*)$/; // Files

export function middleware(req: NextRequest) {
  // Clone the URL
  const url = req.nextUrl.clone();

  // Skip public files
  if (PUBLIC_FILE.test(url.pathname) || url.pathname.includes('_next')) return;
  // Skip api routes
  if (url.pathname.includes('/api/')) return;
  // Skip public pages
  const firstPart = url.pathname.split('/')[1]; // url.pathname starts with a "/", so grab the second element
  const isPublicPage = DOMAIN_BLACKLIST.includes(firstPart);

  if (isPublicPage) return;

  const host = req.headers.get('host');
  const customDomain = getCustomDomainFromHost(host);
  const subdomain = customDomain ? null : getSpaceDomainFromHost(host);
  const spaceDomainFromPath = getSpaceDomainFromUrlPath(url.pathname);

  if (subdomain && spaceDomainFromPath && spaceDomainFromPath === subdomain) {
    // We are on url with subdomain AND domain in path - redirect to url without domain in path
    const pathWithoutSpaceDomain = url.pathname.replace(`/${spaceDomainFromPath}`, '') || '/';

    url.pathname = pathWithoutSpaceDomain;

    return NextResponse.redirect(url);
  }

  const rewriteDomain = customDomain || subdomain;
  if (rewriteDomain) {
    // Subdomain available, rewriting
    url.pathname = `/${rewriteDomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }
}
