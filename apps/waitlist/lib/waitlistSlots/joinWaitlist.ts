import { log } from '@charmverse/core/log';
import { prisma, type ConnectWaitlistSlot } from '@charmverse/core/prisma-client';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';

import { refreshUserScore } from '../scoring/refreshUserScore';

type WaitlistJoinRequest = {
  fid: number | string;
  referredByFid?: number | string | null;
  username: string;
};

export async function joinWaitlist({ fid, username, referredByFid }: WaitlistJoinRequest): Promise<{
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

  const parsedReferrer = referredByFid ? parseInt(referredByFid.toString(), 10) : null;

  let newSlot = await prisma.connectWaitlistSlot.create({
    data: {
      id: deterministicV4UUIDFromFid(parsedFid),
      fid: parsedFid,
      username,
      referredByFid: parsedReferrer !== parsedFid ? parsedReferrer : null,
      score: 0
    }
  });

  if (referredByFid) {
    await refreshUserScore({ fid: parseInt(referredByFid.toString(), 10) }).catch((error) => {
      log.error(`Failed to update referring user score with fid ${referredByFid}`, { error, fid: referredByFid });
    });
  }

  newSlot = await refreshUserScore({ fid: parsedFid });

  return {
    waitlistSlot: newSlot,
    isNew: true
  };
}
