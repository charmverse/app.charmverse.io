import { prisma } from '@charmverse/core/prisma-client';

import type { OptimismProjectAttestationContent } from 'pages/api/optimism/projects';

import type { FarcasterUser } from '../farcaster/getFarcasterUsers';
import { getFarcasterUsers } from '../farcaster/getFarcasterUsers';
import { isTruthy } from '../utils/types';

export async function getOpProjectsByFarcasterId({ farcasterId }: { farcasterId: number }) {
  const optimismProjectAttestations = (await prisma.optimismProjectAttestation.findMany({
    where: {
      farcasterIds: {
        has: farcasterId
      }
    }
  })) as OptimismProjectAttestationContent[];

  const farcasterUsers = await getFarcasterUsers({
    fids: optimismProjectAttestations.flatMap((attestation) => attestation.farcasterIds)
  });

  const farcasterUsersRecord: Record<number, FarcasterUser> = farcasterUsers.reduce<Record<number, FarcasterUser>>(
    (acc, user) => {
      acc[user.fid] = user;
      return acc;
    },
    {}
  );

  return optimismProjectAttestations.map((attestation) => {
    return {
      ...attestation,
      teamMembers: attestation.farcasterIds
        .map((fid) => {
          const user = farcasterUsersRecord[fid];
          if (!user) {
            return null;
          }
          return {
            username: user.username,
            name: user.display_name,
            avatar: user.pfp_url,
            fid: user.fid
          };
        })
        .filter(isTruthy)
    };
  });
}
