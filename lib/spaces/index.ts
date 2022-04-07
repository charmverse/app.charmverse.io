
import { publicPages } from 'components/common/RouteGuard';

export const DOMAIN_BLACKLIST = ['api', 'invite', 'login', 'signup', 'createWorkspace', 'share', 'images', 'join', ...publicPages];

export function isSpaceDomain (domain: string) {
  return domain && !DOMAIN_BLACKLIST.includes(domain);
}
