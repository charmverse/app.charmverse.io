import { isStagingEnv } from 'config/constants';
import { getValidDefaultHost } from 'lib/utilities/domains/getValidDefaultHost';
import { isLocalhostAlias } from 'lib/utilities/domains/isLocalhostAlias';

export function getValidSubdomain(host?: string | null) {
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

  const defaultHost = getValidDefaultHost(host);

  if (defaultHost && defaultHost.includes('.')) {
    const candidate = defaultHost.split('.')[0];

    if (candidate) {
      // default staging subdomain is pr-<pr-number> and it should be skipped
      if (isStagingEnv && candidate.startsWith('pr-')) {
        return null;
      }

      // main app sumbdomain should be skipped
      if (candidate === 'app') {
        return null;
      }

      return candidate;
    }
  }

  return null;
}
