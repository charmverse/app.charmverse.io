import { DOMAIN_BLACKLIST } from 'lib/spaces/config';

export function getSpaceDomainFromUrlPath(path?: string) {
  if (!path) {
    return null;
  }

  const pathWithoutQuery = path.split('?')[0];
  const pathSegments = pathWithoutQuery.split('/');

  // pattern: /domain/page - pathSegments[1]
  // pattern: domain/page - pathSegments[0]
  const spaceDomain = pathWithoutQuery.startsWith('/') ? pathSegments[1] : pathSegments[0];

  if (DOMAIN_BLACKLIST.includes(spaceDomain)) {
    return null;
  }

  return spaceDomain;
}
