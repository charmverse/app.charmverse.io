import { log } from '@charmverse/core/log';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isTestEnv } from 'config/constants';
import { DOMAIN_BLACKLIST } from 'lib/spaces/config';
import { getValidCustomDomain } from 'lib/utilities/domains/getValidCustomDomain';
import { getSpaceDomainFromUrlPath } from 'lib/utilities/getSpaceDomainFromUrlPath';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';
// RegExp for public files
const PUBLIC_FILE = /\.(.*)$/; // Files

export async function middleware(req: NextRequest) {
  if (isTestEnv) {
    // Skip middleware in tests
    return;
  }

  // Clone the URL
  const url = req.nextUrl.clone();

  // Skip public files
  if (PUBLIC_FILE.test(url.pathname) || url.pathname.includes('_next')) return;
  // Skip api routes
  if (url.pathname.includes('/api/')) return;
  // Skip public pages
  const isPublicPage = DOMAIN_BLACKLIST.some((page) => url.pathname.startsWith(`/${page}`));
  // console.log('isPublicPage:', isPublicPage);
  if (isPublicPage) return;

  const host = req.headers.get('host');
  const customDomain = getValidCustomDomain(host);
  const subdomain = customDomain ? null : getValidSubdomain(host);
  const spaceDomainFromPath = getSpaceDomainFromUrlPath(url.pathname);

  if (subdomain && spaceDomainFromPath && spaceDomainFromPath === subdomain) {
    // We are on url with subdomain AND domain in path - redirect to url without domain in path
    const pathWithourSpaceDomain = url.pathname.replace(`/${spaceDomainFromPath}`, '') || '/';
    log.info(`>>> Redirecting: ${url.pathname} to ${pathWithourSpaceDomain}`);
    url.pathname = pathWithourSpaceDomain;

    return NextResponse.redirect(url);
  }

  const rewriteDomain = customDomain || subdomain;
  if (rewriteDomain) {
    // Subdomain available, rewriting
    log.info(`>>> Rewriting: ${url.pathname} to /${rewriteDomain}${url.pathname}`);
    url.pathname = `/${rewriteDomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }
}
