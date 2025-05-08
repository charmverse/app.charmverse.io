import { DOMAIN_BLACKLIST } from '@packages/spaces/config';

export function isSpaceDomain(path?: string) {
  if (!path) {
    return false;
  }
  const pathSegments = path.split('?');
  const domain = pathSegments[0];

  return domain && !DOMAIN_BLACKLIST.includes(domain);
}

export function getSpaceDomainFromName(name: string) {
  return name
    .replace(/[^\w\s-]/gu, '')
    .replace(/(\s|\.)/g, '-')
    .toLowerCase();
}

export function isCustomDomain(domain?: string) {
  return domain?.includes('.');
}
