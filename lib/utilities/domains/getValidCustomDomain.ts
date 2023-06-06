import { getValidDefaultHost } from 'lib/utilities/domains/getValidDefaultHost';
import { isLocalhostAlias } from 'lib/utilities/domains/isLocalhostAlias';

export function getValidCustomDomain(host?: string | null) {
  if (!host && typeof window !== 'undefined') {
    // On client side, get the host from window
    host = window.location.host;
  }

  if (isLocalhostAlias(host)) {
    return null;
  }

  const defaultHost = getValidDefaultHost(host);

  if (defaultHost) {
    // app runs on default domain so space does not use custom domain
    return null;
  }

  const customDomain = host?.split(':')[0];

  return customDomain || null;
}
