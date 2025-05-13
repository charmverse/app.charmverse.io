import { headers } from 'next/headers';

/**
 * Get IP address from next/headers
 *
 * @returns IP address as string
 */
export function getIPFromRequest() {
  const forwardedFor = headers().get('x-forwarded-for');
  const realIp = headers().get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return undefined;
}
