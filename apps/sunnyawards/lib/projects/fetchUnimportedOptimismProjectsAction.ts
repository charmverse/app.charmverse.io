'use server';

import type { OptimismProjectAttestation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';
import { authActionClient } from '@connect-shared/lib/actions/actionClient';
import type { FarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';

export type OptimismProjectWithMembers = OptimismProjectAttestation & {
  projectMembers: { farcasterId: number; name: string }[];
};

export const fetchUnimportedOptimismProjectsAction = authActionClient
  .metadata({ actionName: 'fetch-unimported-projects' })
  .action(async ({ ctx }) => {
    const currentUserId = ctx.session.user.id;

    const farcasterUser = await prisma.farcasterUser.findUniqueOrThrow({
      where: {
        userId: currentUserId
      }
    });

    const attestationsWithoutProject = await prisma.optimismProjectAttestation.findMany({
      where: {
        farcasterIds: {
          hasSome: [farcasterUser.fid]
        },
        projectId: null
      }
    });

    const uniqueFarcasterUserIds = arrayUtils.uniqueValues(
      attestationsWithoutProject.flatMap((attestation) => attestation.farcasterIds)
    );

    const farcasterUsers = (await prisma.farcasterUser.findMany({
      where: {
        fid: {
          in: uniqueFarcasterUserIds
        }
      },
      select: {
        fid: true,
        account: true
      }
    })) as { fid: number; account: FarcasterProfile['body'] }[];

    const farcasterUserMap = farcasterUsers.reduce((acc, user) => {
      acc[user.fid] = user.account.displayName;
      return acc;
    }, {} as Record<number, string>);

    const unresolvedUsers = arrayUtils.uniqueValues(
      attestationsWithoutProject.flatMap((attestation) => {
        const fidsWithoutProfile: number[] = [];

        for (const fid of attestation.farcasterIds) {
          if (!farcasterUserMap[fid]) {
            fidsWithoutProfile.push(fid);
          }
        }

        return fidsWithoutProfile;
      })
    );

    const farcasterProfiles = unresolvedUsers.length ? await getFarcasterUsers({ fids: unresolvedUsers }) : [];

    for (const resolvedFarcasterUser of farcasterProfiles) {
      farcasterUserMap[resolvedFarcasterUser.fid] = resolvedFarcasterUser.display_name;
    }

    return attestationsWithoutProject.map((attestation) => {
      const projectMembers = attestation.farcasterIds
        .map((fid) => (farcasterUserMap[fid] ? { farcasterId: fid, name: farcasterUserMap[fid] } : null))
        .filter(Boolean) as { farcasterId: number; name: string }[];

      return {
        ...attestation,
        projectMembers
      };
    }) as OptimismProjectWithMembers[];
  });
