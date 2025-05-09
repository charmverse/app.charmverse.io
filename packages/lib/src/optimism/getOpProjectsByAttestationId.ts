import { prisma } from '@charmverse/core/prisma-client';

import { getFarcasterUsers } from '../farcaster/getFarcasterUsers';

import type { OptimismProjectAttestationContent } from './getOpProjectsByFarcasterId';

export async function getOpProjectsByAttestationId({ projectRefUID }: { projectRefUID: string }) {
  const optimismProjectAttestation = await prisma.optimismProjectAttestation.findUnique({
    where: {
      projectRefUID
    }
  });

  if (!optimismProjectAttestation) {
    return null;
  }

  const farcasterUsers = await getFarcasterUsers({
    fids: optimismProjectAttestation.farcasterIds
  });

  return {
    ...optimismProjectAttestation,
    teamMembers: optimismProjectAttestation.farcasterIds
      .map((fid) => {
        const user = farcasterUsers.find((u) => u.fid === fid);
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
      .filter(Boolean)
  } as OptimismProjectAttestationContent;
}
