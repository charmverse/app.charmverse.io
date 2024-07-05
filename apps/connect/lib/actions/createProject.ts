'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect/lib/actions/actionClient';
import { v4 } from 'uuid';

import { getFarcasterProfile } from 'lib/farcaster/getFarcasterProfile';
import { uid } from 'lib/utils/strings';
import { isTruthy } from 'lib/utils/types';

import { storeProjectMetadataAndPublishOptimismAttestation } from '../attestations/storeProjectMetadataAndPublishOptimismAttestation';
import type { FormValues } from '../projects/form';
import { schema } from '../projects/form';
import { generateOgImage } from '../projects/generateOgImage';

export type FarcasterAccount = {
  id: number;
  address: string;
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  following: number;
  avatarUrl: string;
  isVerifiedAvatar: boolean;
  registeredAt: number;
};

export const actionCreateProject = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput as FormValues;
    const currentUserId = ctx.session.user!.id;
    const farcasterAccounts = await prisma.farcasterUser.findMany({
      where: {
        fid: {
          in: input.projectMembers.slice(1).map(({ farcasterId }) => farcasterId)
        }
      },
      select: {
        userId: true,
        fid: true
      }
    });

    const farcasterAccountsUserIdRecord: Record<number, string> = farcasterAccounts.reduce<Record<number, string>>(
      (acc, { userId, fid }) => {
        acc[fid] = userId;
        return acc;
      },
      {}
    );

    const projectMembers = (
      await Promise.all(
        input.projectMembers.slice(1).map(async (member) => {
          if (farcasterAccountsUserIdRecord[member.farcasterId]) {
            return {
              userId: farcasterAccountsUserIdRecord[member.farcasterId],
              name: member.name,
              farcasterId: member.farcasterId
            };
          }
          try {
            const farcasterProfile = await getFarcasterProfile({
              fid: member.farcasterId
            });
            if (!farcasterProfile) {
              return null;
            }
            const farcasterWalletUser = await prisma.user.findFirst({
              where: {
                wallets: {
                  some: {
                    address: {
                      in: farcasterProfile.connectedAddresses.map((address) => address.toLowerCase())
                    }
                  }
                }
              }
            });
            if (farcasterWalletUser) {
              return {
                userId: farcasterWalletUser.id,
                name: member.name,
                farcasterId: member.farcasterId
              };
            }
            const username = farcasterProfile.body.username;
            const displayName = farcasterProfile.body.displayName;
            const bio = farcasterProfile.body.bio;
            const pfpUrl = farcasterProfile.body.avatarUrl;
            const fid = member.farcasterId;

            const newUser = await prisma.user.create({
              data: {
                id: v4(),
                username,
                identityType: 'Farcaster',
                claimed: false,
                avatar: farcasterProfile.body.avatarUrl,
                farcasterUser: {
                  create: {
                    account: { username, displayName, bio, pfpUrl },
                    fid
                  }
                },
                path: uid(),
                profile: {
                  create: {
                    ...(bio && { description: bio || '' })
                  }
                }
              }
            });

            return {
              userId: newUser.id,
              name: member.name,
              farcasterId: member.farcasterId
            };
          } catch (err) {
            return null;
          }
        })
      )
    ).filter(isTruthy);

    const newProject = await prisma.project.create({
      data: {
        name: input.name,
        updatedBy: currentUserId,
        createdBy: currentUserId,
        description: input.description,
        category: input.category,
        websites: input.websites?.filter(isTruthy),
        farcasterValues: input.farcasterIds?.filter(isTruthy),
        twitter: input.twitter,
        github: input.github,
        mirror: input.mirror,
        avatar: input.avatar,
        coverImage: input.cover,
        source: 'connect',
        projectMembers: {
          createMany: {
            data: [
              {
                teamLead: true,
                updatedBy: currentUserId,
                userId: currentUserId,
                name: input.projectMembers[0].name,
                farcasterId: input.projectMembers[0].farcasterId
              },
              ...projectMembers.map((member) => ({
                teamLead: false,
                updatedBy: currentUserId,
                userId: member.userId,
                name: member.name,
                farcasterId: member.farcasterId
              }))
            ]
          }
        }
      }
    });

    await storeProjectMetadataAndPublishOptimismAttestation({
      projectId: newProject.id,
      userId: currentUserId
    }).catch((err) => {
      log.error('Failed to store project metadata and publish optimism attestation', { err, userId: currentUserId });
    });

    await generateOgImage(newProject.id, currentUserId);

    return { success: true, projectId: newProject.id };
  });
