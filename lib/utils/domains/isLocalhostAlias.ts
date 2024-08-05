export function isLocalhostAlias(host?: string | null) {
  if (!host && typeof window !== 'undefined') {
    // On client side, get the host from window
    host = window.location.host;
  }

  return host?.includes('localhost') || host?.includes('127.0.0.1');
}
