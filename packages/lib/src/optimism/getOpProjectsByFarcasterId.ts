import { prisma } from '@charmverse/core/prisma-client';
import type { OptimismProjectAttestation } from '@charmverse/core/prisma-client';
import type { FarcasterUser } from '@packages/lib/farcaster/getFarcasterUsers';
import { getFarcasterUsers } from '@packages/lib/farcaster/getFarcasterUsers';
import { isTruthy } from '@packages/utils/types';

import type { OptimismProjectMetadata } from './storeOptimismProjectAttestations';

export type OptimismProjectAttestationContent = Omit<OptimismProjectAttestation, 'metadata'> & {
  metadata: OptimismProjectMetadata;
  teamMembers: {
    username: string;
    name: string;
    avatar: string;
    fid: number;
  }[];
};

export async function getOpProjectsByFarcasterId({ farcasterId }: { farcasterId: number }) {
  const optimismProjectAttestations = await prisma.optimismProjectAttestation.findMany({
    where: {
      farcasterIds: {
        has: farcasterId
      }
    }
  });

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
  }) as OptimismProjectAttestationContent[];
}
