import { getCustomDomainFromHost } from './getCustomDomainFromHost';
import { getSpaceDomainFromHost } from './getSpaceDomainFromHost';

// Given a hostname, space domain, and path, return a path that can be used to open a page.
export function getPagePath({ hostName, spaceDomain, path }: { hostName?: string; spaceDomain: string; path: string }) {
  const isDomainInPath = !getCustomDomainFromHost(hostName) && !getSpaceDomainFromHost(hostName);
  return encodeURI(`/${isDomainInPath ? `${spaceDomain}/` : ''}${path}`);
}
