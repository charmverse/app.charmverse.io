
export const DOMAIN_BLACKLIST = [
  'api',
  'api-docs',
  'createWorkspace',
  'integrations',
  'invite',
  'login',
  'images',
  'join',
  'nexus',
  'profile',
  'share',
  'signup',
  'u'
];

export function isSpaceDomain (path?: string) {
  if (!path) {
    return false;
  }
  const pathSegments = path.split('?');
  const domain = pathSegments[0];

  return domain && !DOMAIN_BLACKLIST.includes(domain);
}
