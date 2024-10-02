import { log } from '@charmverse/core/log';
import { prisma, type ConnectWaitlistSlot } from '@charmverse/core/prisma-client';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import { refreshUserScore } from '@packages/scoutgame/waitlist/scoring/refreshUserScore';

import type { WaitlistEventMap } from 'lib/mixpanel/trackEventActionSchema';
import { trackWaitlistMixpanelEvent } from 'lib/mixpanel/trackWaitlistMixpanelEvent';

type WaitlistJoinRequest = {
  fid: number | string;
  referredByFid?: number | string | null;
  username: string;
  isPartnerAccount?: boolean;
  waitlistAnalytics?: Omit<WaitlistEventMap['join_waitlist'], 'userId'>;
};

export async function joinWaitlist({
  fid,
  username,
  referredByFid,
  isPartnerAccount,
  waitlistAnalytics
}: WaitlistJoinRequest): Promise<{
  waitlistSlot: ConnectWaitlistSlot;
  isNew: boolean;
}> {
  const parsedFid = parseInt(fid.toString(), 10);

  const existingSlot = await prisma.connectWaitlistSlot.findUnique({
    where: {
      fid: parsedFid
    }
  });

  if (existingSlot) {
    return {
      waitlistSlot: existingSlot,
      isNew: false
    };
  }

  let parsedReferrer = referredByFid ? parseInt(referredByFid.toString(), 10) : null;

  if (parsedReferrer) {
    const referrerSlot = await prisma.connectWaitlistSlot.findUnique({
      where: {
        fid: parsedReferrer
      },
      select: {
        fid: true
      }
    });

    if (!referrerSlot) {
      parsedReferrer = null;
      log.error(`Failed to find referrer slot with fid ${referredByFid}`, { fid: referredByFid });
    }
  }

  let newSlot = await prisma.connectWaitlistSlot.create({
    data: {
      id: deterministicV4UUIDFromFid(parsedFid),
      fid: parsedFid,
      username,
      referredByFid: parsedReferrer !== parsedFid ? parsedReferrer : null,
      score: 0,
      percentile: isPartnerAccount ? 100 : 1,
      isPartnerAccount
    }
  });

  if (referredByFid) {
    await refreshUserScore({ fid: parseInt(referredByFid.toString(), 10) }).catch((error) => {
      log.error(`Failed to update referring user score with fid ${referredByFid}`, { error, fid: referredByFid });
    });
  }

  if (waitlistAnalytics) {
    trackWaitlistMixpanelEvent('join_waitlist', {
      ...waitlistAnalytics,
      userId: deterministicV4UUIDFromFid(parsedFid)
    });
  }
  newSlot = await refreshUserScore({ fid: parsedFid });

  return {
    waitlistSlot: newSlot,
    isNew: true
  };
}
