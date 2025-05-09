import { getValidDefaultHost } from '@packages/lib/utils/domains/getValidDefaultHost';
import { isLocalhostAlias } from '@packages/lib/utils/domains/isLocalhostAlias';

export function getCustomDomainFromHost(host?: string | null) {
  if (process.env.DISABLE_SUBDOMAINS === 'true') {
    return null;
  }

  if (!host && typeof window !== 'undefined') {
    // On client side, get the host from window
    host = window.location.host;
  }

  if (isLocalhostAlias(host)) {
    return null;
  }

  const hostname = host?.split(':')[0];

  if (hostname && !/[a-z]/i.test(hostname)) {
    // hostname is an IP address - case not supported
    return null;
  }

  const defaultHost = getValidDefaultHost(hostname);

  if (defaultHost) {
    // app runs on default domain so space does not use custom domain
    return null;
  }

  return hostname || null;
}
