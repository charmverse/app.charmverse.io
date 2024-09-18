import { UnauthorisedActionError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { isDevEnv, isStagingEnv } from '@root/config/constants';

// check htat user signed up to the waitlist
export async function requireWaitlistUser({ fid }: { fid: number }) {
  if (isDevEnv || isStagingEnv) {
    log.debug('Skip whitelist check in dev/staging');
    return;
  }
  const waitlistRecord = await prisma.connectWaitlistSlot.count({
    where: {
      fid
    }
  });
  if (waitlistRecord === 0) {
    // double-check if user is already a scout user
    const scoutUser = await prisma.scout.count({
      where: {
        farcasterId: fid
      }
    });
    if (scoutUser === 0) {
      throw new UnauthorisedActionError('Scout Game is in private beta');
    }
  }
}
