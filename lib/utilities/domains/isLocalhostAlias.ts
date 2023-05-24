export function isLocalhostAlias(host?: string | null) {
  return host?.includes('localhost') || host?.includes('127.0.0.1');
}
