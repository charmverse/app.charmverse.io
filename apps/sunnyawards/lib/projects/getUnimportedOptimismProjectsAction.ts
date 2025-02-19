'use server';

import type { OptimismProjectAttestation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';
import { authActionClient } from '@packages/connect-shared/lib/actions/actionClient';
import type { ConnectProjectMember } from '@packages/connect-shared/lib/projects/findProject';
import type { FarcasterProfile } from '@root/lib/farcaster/getFarcasterProfile';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';

export type OptimismProjectWithMembers = OptimismProjectAttestation & {
  projectMembers: ConnectProjectMember[];
};

export const getUnimportedOptimismProjectsAction = authActionClient
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
        userId: true,
        fid: true,
        account: true
      }
    })) as { fid: number; account: FarcasterProfile['body']; userId: string }[];

    const farcasterUserMap = farcasterUsers.reduce(
      (acc, user) => {
        acc[user.fid] = user.account;
        return acc;
      },
      {} as Record<number, FarcasterProfile['body']>
    );

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
      farcasterUserMap[resolvedFarcasterUser.fid] = {
        address: resolvedFarcasterUser.custody_address,
        avatarUrl: resolvedFarcasterUser.pfp_url,
        bio: resolvedFarcasterUser.profile.bio.text,
        displayName: resolvedFarcasterUser.display_name,
        followers: 0,
        following: 0,
        id: resolvedFarcasterUser.fid,
        isVerifiedAvatar: true,
        registeredAt: 0,
        username: resolvedFarcasterUser.username
      };
    }

    return attestationsWithoutProject.map((attestation) => {
      const projectMembers = attestation.farcasterIds.map((fid) =>
        farcasterUserMap[fid]
          ? {
              teamLead: fid === farcasterUser.fid,
              farcasterId: fid,
              name: farcasterUserMap[fid].displayName,
              farcasterUser: { ...farcasterUserMap[fid], fid },
              userId: farcasterUsers.find((user) => user.fid === fid)?.userId || null
            }
          : null
      );

      return {
        ...attestation,
        projectMembers
      };
    }) as OptimismProjectWithMembers[];
  });
