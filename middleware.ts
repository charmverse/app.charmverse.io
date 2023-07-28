import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isDevEnv, isTestEnv } from 'config/constants';
import { DOMAIN_BLACKLIST } from 'lib/spaces/config';
import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';
import { getValidCustomDomain } from 'lib/utilities/domains/getValidCustomDomain';
import { getSpaceDomainFromUrlPath } from 'lib/utilities/getSpaceDomainFromUrlPath';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';
// RegExp for public files
const PUBLIC_FILE = /\.(.*)$/; // Files

const FORCE_SUBDOMAINS = process.env.FORCE_SUBDOMAINS === 'true';

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

  if (isPublicPage) return;

  const host = req.headers.get('host');
  const customDomain = getValidCustomDomain(host);
  const subdomain = customDomain ? null : getValidSubdomain(host);
  const spaceDomainFromPath = getSpaceDomainFromUrlPath(url.pathname);

  if (FORCE_SUBDOMAINS && !subdomain && !customDomain && spaceDomainFromPath) {
    // We are on url without subdomain AND domain in path - redirect to subdomain url
    const subdomainHost = `${spaceDomainFromPath}.${getAppApexDomain()}`;
    const pathWithoutSpaceDomain = url.pathname.replace(`/${spaceDomainFromPath}`, '') || '/';
    const port = isDevEnv ? `:${url.port}` : '';
    const baseUrl = `${url.protocol}//${subdomainHost}${port}`;
    const redirectUrl = new URL(pathWithoutSpaceDomain, baseUrl);

    return NextResponse.redirect(redirectUrl);
  }

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
