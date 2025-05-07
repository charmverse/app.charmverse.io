import { log } from '@charmverse/core/log';
import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';

let cache: Record<string, { isValid: boolean }> = {};
let intervalId: ReturnType<typeof setInterval> | undefined;

const INVALIDATE_CACHE_INTERVAL = 1000 * 60 * 5; // 5mins

invalidateCache();

export async function verifyCustomOrigin(origin: string | undefined) {
  if (!origin) {
    return false;
  }

  const originName = origin.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  try {
    if (!cache[origin]) {
      const space = await getSpaceByDomain(originName);

      cache[origin] = { isValid: !!space };
    }

    return cache[origin]?.isValid ?? false;
  } catch (error) {
    log.error('Error veryfing custom cors origin', { error, origin });

    return false;
  }
}

function clearCache() {
  cache = {};
}

function invalidateCache() {
  if (!intervalId) {
    intervalId = setInterval(clearCache, INVALIDATE_CACHE_INTERVAL);
  }
}

// allow app and tests to shut the process down properly
export function cleanup() {
  clearInterval(intervalId);
}
