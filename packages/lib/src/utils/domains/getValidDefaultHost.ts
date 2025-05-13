import { getAppApexDomain } from '@packages/lib/utils/domains/getAppApexDomain';

export function getValidDefaultHost(host?: string | null) {
  if (!host && typeof window !== 'undefined') {
    // On client side, get the host from window
    host = window.location.host;
  }

  const apexDomain = getAppApexDomain() || '';

  return host && host.includes(apexDomain) ? host : null;
}
