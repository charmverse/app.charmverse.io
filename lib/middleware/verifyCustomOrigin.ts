import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

let cache: Record<string, { isValid: boolean }> = {};
let intervalId: NodeJS.Timer;

const INVALIDATE_CACHE_INTERVAL = 1000 * 60 * 5; // 5mins

invalidateCache();

export async function verifyCustomOrigin(origin: string | undefined) {
  if (!origin) {
    return false;
  }

  try {
    if (!cache[origin]) {
      const space = await prisma.space.findFirst({
        where: {
          customDomain: { endsWith: origin }
        }
      });

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
