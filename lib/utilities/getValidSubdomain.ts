export function getValidSubdomain(host?: string | null) {
  let subdomain: string | null = null;

  if (!host && typeof window !== 'undefined') {
    // On client side, get the host from window
    host = window.location.host;
  }

  if (isLocalhostAlias(host)) {
    return null;
  }

  if (host && host.includes('.')) {
    const candidate = host.split('.')[0];
    if (candidate) {
      // Valid candidate
      subdomain = candidate;
    }
  }

  return subdomain;
}

export function isLocalhostAlias(host?: string | null) {
  return host?.includes('localhost') || host?.includes('127.0.0.1');
}
