
export const DOMAIN_BLACKLIST = ['api', 'invite', 'login', 'signup', 'createWorkspace', 'share', 'images', 'join'];

export function isSpaceDomain (domain: string) {
  return domain && !DOMAIN_BLACKLIST.includes(domain);
}
